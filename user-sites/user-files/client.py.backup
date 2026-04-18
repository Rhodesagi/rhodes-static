import json
import logging
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from contextlib import nullcontext
from typing import Sequence

import mlflow
from mlflow.entities.assessment import Assessment
from mlflow.entities.issue import Issue, IssueStatus
from mlflow.entities.model_registry import PromptVersion
from mlflow.entities.span import NO_OP_SPAN_TRACE_ID, Span
from mlflow.entities.trace import Trace
from mlflow.entities.trace_data import TraceData
from mlflow.entities.trace_info import TraceInfo
from mlflow.entities.trace_location import UCSchemaLocation, UnityCatalog
from mlflow.environment_variables import (
    _MLFLOW_SEARCH_TRACES_MAX_BATCH_SIZE,
    MLFLOW_SEARCH_TRACES_MAX_THREADS,
    MLFLOW_TRACING_SQL_WAREHOUSE_ID,
)
from mlflow.exceptions import (
    MlflowException,
    MlflowNotImplementedException,
    MlflowTraceDataCorrupted,
    MlflowTraceDataException,
    MlflowTraceDataNotFound,
)
from mlflow.protos.databricks_pb2 import (
    BAD_REQUEST,
    INVALID_PARAMETER_VALUE,
    NOT_FOUND,
    RESOURCE_DOES_NOT_EXIST,
)
from mlflow.store.artifact.artifact_repository_registry import get_artifact_repository
from mlflow.store.entities.paged_list import PagedList
from mlflow.store.tracking import SEARCH_TRACES_DEFAULT_MAX_RESULTS
from mlflow.telemetry.events import LogAssessmentEvent, StartTraceEvent
from mlflow.telemetry.track import record_usage_event
from mlflow.tracing.constant import (
    GET_TRACE_V4_RETRY_TIMEOUT_SECONDS,
    SpansLocation,
    TraceMetadataKey,
    TraceTagKey,
)
from mlflow.tracing.trace_manager import InMemoryTraceManager
from mlflow.tracing.utils import TraceJSONEncoder, exclude_immutable_tags, parse_trace_id_v4
from mlflow.tracing.utils.artifact_utils import get_artifact_uri_for_trace
from mlflow.tracking._tracking_service.utils import _get_store, _resolve_tracking_uri
from mlflow.utils import is_uuid
from mlflow.utils.mlflow_tags import IMMUTABLE_TAGS
from mlflow.utils.uri import add_databricks_profile_info_to_artifact_uri, is_databricks_uri

_logger = logging.getLogger(__name__)


class TracingClient:
    """
    Client of an MLflow Tracking Server that creates and manages experiments and runs.
    """

    def __init__(self, tracking_uri: str | None = None):
        """
        Args:
            tracking_uri: Address of local or remote tracking server.
        """
        self.tracking_uri = _resolve_tracking_uri(tracking_uri)
        # NB: Fetch the tracking store (`self.store`) upon client initialization to ensure that
        # the tracking URI is valid and the store can be properly resolved. We define `store` as a
        # property method to ensure that the client is serializable, even if the store is not
        # self.store
        self.store

    @property
    def store(self):
        return _get_store(self.tracking_uri)

    @record_usage_event(StartTraceEvent)
    def start_trace(self, trace_info: TraceInfo) -> TraceInfo:
        """
        Create a new trace in the backend.

        Args:
            trace_id: The ID of the trace.
            assessment_id: The ID of the assessment to get.

        Returns:
            The Assessment object.
        """

        return self.store.get_assessment(trace_id, assessment_id)

    @record_usage_event(LogAssessmentEvent)
    def log_assessment(self, trace_id: str, assessment: Assessment) -> Assessment:
        """
        Log an assessment to a trace.

        Args:
            trace_id: The ID of the trace.
            assessment: The assessment object to log.

        Returns:
            The logged Assessment object.
        """
        assessment.trace_id = trace_id

        if trace_id is None or trace_id == NO_OP_SPAN_TRACE_ID:
            _logger.debug(
                "Skipping assessment logging for NO_OP_SPAN_TRACE_ID. This is expected when "
                "tracing is disabled."
            )
            return assessment

        # If the trace is the active trace, add the assessment to it in-memory
        if trace_id == mlflow.get_active_trace_id():
            with InMemoryTraceManager.get_instance().get_trace(trace_id) as trace:
                if trace is None:
                    _logger.debug(
                        f"Trace {trace_id} is active but not found in the in-memory buffer. "
                        "Something is wrong with trace handling. Skipping assessment logging."
                    )
                trace.info.assessments.append(assessment)
            return assessment
        return self.store.create_assessment(assessment)

    def update_assessment(
        self,
        trace_id: str,
        assessment_id: str,
        assessment: Assessment,
    ):
        """
        Update an existing assessment entity in the backend store.

        Args:
            trace_id: The ID of the trace.
            assessment_id: The ID of the feedback assessment to update.
            assessment: The updated assessment.
        """

        return self.store.update_assessment(
            trace_id=trace_id,
            assessment_id=assessment_id,
            name=assessment.name,
            expectation=assessment.expectation,
            feedback=assessment.feedback,
            rationale=assessment.rationale,
            metadata=assessment.metadata,
        )

    def delete_assessment(self, trace_id: str, assessment_id: str):
        """
        Delete an assessment associated with a trace.

        Args:
            trace_id: The ID of the trace.
            assessment_id: The ID of the assessment to delete.
        """

        self.store.delete_assessment(trace_id=trace_id, assessment_id=assessment_id)

    def _get_artifact_repo_for_trace(self, trace_info: TraceInfo):
        artifact_uri = get_artifact_uri_for_trace(trace_info)
        artifact_uri = add_databricks_profile_info_to_artifact_uri(artifact_uri, self.tracking_uri)
        return get_artifact_repository(artifact_uri)

    def _download_trace_data(self, trace_info: TraceInfo) -> TraceData:
        """
        Download trace data from artifact repository.

        Args:
            trace_info: Either a TraceInfo or TraceInfoV3 object containing trace metadata.

        Returns:
            TraceData object representing the downloaded trace data.
        """
        artifact_repo = self._get_artifact_repo_for_trace(trace_info)
        return TraceData.from_dict(artifact_repo.download_trace_data())

    def _upload_trace_data(self, trace_info: TraceInfo, trace_data: TraceData) -> None:
        artifact_repo = self._get_artifact_repo_for_trace(trace_info)
        trace_data_json = json.dumps(trace_data.to_dict(), cls=TraceJSONEncoder, ensure_ascii=False)
        return artifact_repo.upload_trace_data(trace_data_json)

    def link_prompt_versions_to_trace(
        self, trace_id: str, prompts: Sequence[PromptVersion]
    ) -> None:
        """
        Link multiple prompt versions to a trace.

        Args:
            trace_id: The ID of the trace to link prompts to.
            prompts: List of PromptVersion objects to link to the trace.
        """
        from mlflow.tracking._model_registry.utils import _get_store as _get_model_registry_store

        registry_store = _get_model_registry_store()
        registry_store.link_prompts_to_trace(prompt_versions=prompts, trace_id=trace_id)

    def _set_experiment_trace_location(
        self,
        location: UCSchemaLocation,
        experiment_id: str,
        sql_warehouse_id: str | None = None,
    ) -> UCSchemaLocation:
        if is_databricks_uri(self.tracking_uri):
            return self.store.set_experiment_trace_location(
                experiment_id=str(experiment_id),
                location=location,
                sql_warehouse_id=sql_warehouse_id,
            )
        raise MlflowException(
            "Setting storage location is not supported on non-Databricks backends."
        )

    def _get_trace_location(self, telemetry_profile_id: str) -> UnityCatalog:
        if is_databricks_uri(self.tracking_uri) and hasattr(self.store, "get_trace_location"):
            return self.store.get_trace_location(telemetry_profile_id)
        raise MlflowException("Getting trace location by ID is not supported on this backend.")

    def _create_or_get_trace_location(
        self, location: UnityCatalog, sql_warehouse_id: str | None = None
    ) -> UnityCatalog:
        if is_databricks_uri(self.tracking_uri) and hasattr(
            self.store, "create_or_get_trace_location"
        ):
            return self.store.create_or_get_trace_location(location, sql_warehouse_id)
        raise MlflowException("Creating trace location is not supported on this backend.")

    def _link_trace_location(self, experiment_id: str, location: UnityCatalog) -> None:
        if is_databricks_uri(self.tracking_uri) and hasattr(self.store, "link_trace_location"):
            self.store.link_trace_location(experiment_id, location)
            return
        raise MlflowException("Linking trace location is not supported on this backend.")

    def _unset_experiment_trace_location(
        self, experiment_id: str, location: UCSchemaLocation | UnityCatalog
    ) -> None:
        if is_databricks_uri(self.tracking_uri):
            self.store.unset_experiment_trace_location(str(experiment_id), location)
        else:
            raise MlflowException(
                "Clearing storage location is not supported on non-Databricks backends."
            )

    def _create_issue(
        self,
        experiment_id: str,
        name: str,
        description: str,
        status: IssueStatus = IssueStatus.PENDING,
        severity: str | None = None,
        root_causes: list[str] | None = None,
        source_run_id: str | None = None,
        created_by: str | None = None,
    ) -> Issue:
        """
        Create a new issue in the tracking store.

        Args:
            experiment_id: The experiment ID.
            name: Short descriptive name for the issue.
            description: Detailed description of the issue.
            status: Issue status. Defaults to IssueStatus.PENDING if not provided.
            severity: Optional severity level indicator.
            root_causes: Optional list of root cause analyses.
            source_run_id: Optional MLflow run ID that discovered this issue.
            created_by: Optional identifier for who created this issue.

        Returns:
            The created Issue entity.
        """
        return self.store.create_issue(
            experiment_id=experiment_id,
            name=name,
            description=description,
            status=status,
            severity=severity,
            root_causes=root_causes,
            source_run_id=source_run_id,
            created_by=created_by,
        )