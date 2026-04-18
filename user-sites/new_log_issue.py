def log_issue(
    *,
    trace_id: str,
    issue_id: str,
    issue_name: str | None = None,
    source: AssessmentSource | None = None,
    run_id: str | None = None,
    rationale: str | None = None,
    metadata: dict[str, str] | None = None,
    span_id: str | None = None,
) -> Assessment:
    """
    Logs an issue reference to a Trace. This links a trace to a discovered issue.
    This API only takes keyword arguments.

    Args:
        trace_id: The ID of the trace.
        issue_id: The ID of the issue to reference.
        issue_name: The name of the issue. If omitted, the name will be inferred
            from the issue stored in the backend. If provided, it must match the
            stored issue name.
        source: The source represents how this issue was detected on the trace, for example,
                human review or automatic AI scan. Must be an instance of
                :py:class:`~mlflow.entities.AssessmentSource`. If not provided, defaults to
                LLM_JUDGE source type.
        run_id: The ID of the run that detect the issue on the given trace.
        rationale: The rationale / justification for the issue reference.
        metadata: Additional metadata for the issue reference.
        span_id: The ID of the span associated with the issue, if it needs to be
                associated with a specific span in the trace.

    Returns:
        :py:class:`~mlflow.entities.Assessment`: The created issue reference assessment.

    Examples:
        .. code-block:: python

            import mlflow
            from mlflow.entities import AssessmentSource, AssessmentSourceType

            # Log an issue reference to link a trace to a discovered issue
            issue_ref = mlflow.log_issue(
                trace_id="tr-1234567890abcdef",
                issue_id="iss-abcdef123456",
                issue_name="High Latency",
                source=AssessmentSource(
                    source_type=AssessmentSourceType.LLM_JUDGE, source_id="issue-discovery-agent"
                ),
                run_id="run-123",
                rationale="Response time exceeded 2 seconds threshold",
            )
    """
    client = TracingClient()
    issue = client.get_issue(issue_id)
    
    if issue_name is None:
        issue_name = issue.name
    elif issue_name != issue.name:
        raise MlflowException(
            f"Provided issue name '{issue_name}' does not match the issue name "
            f"'{issue.name}' stored for issue ID '{issue_id}'."
        )
    
    assessment = IssueReference(
        issue_id=issue_id,
        issue_name=issue_name,
        source=source,
        trace_id=trace_id,
        run_id=run_id,
        rationale=rationale,
        metadata=metadata,
        span_id=span_id,
    )
    return client.log_assessment(trace_id, assessment)