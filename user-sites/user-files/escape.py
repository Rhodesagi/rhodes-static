import json

old_set = '''    @require_prompt_registry
    @translate_prompt_exception
    def set_prompt_version_tag(self, name: str, version: str | int, key: str, value: str) -> None:
        """
        Set a tag on a specific prompt version.

        Args:
            name: The name of the prompt.
            version: The version number of the prompt.
            key: The tag key.
            value: The tag value.
        """
        self._get_registry_client().set_prompt_version_tag(name, version, key, value)

        # Invalidate cache for this specific version
        PromptCache.get_instance().delete(name, version=int(version))'''

new_set = '''    @require_prompt_registry
    @translate_prompt_exception
    def set_prompt_version_tag(self, name: str, version: str | int, key: str, value: str) -> None:
        """
        Set a tag on a specific prompt version.

        Args:
            name: The name of the prompt.
            version: The version number of the prompt.
            key: The tag key.
            value: The tag value.
        """
        self._get_registry_client().set_prompt_version_tag(name, version, key, value)

        # Invalidate cache for this specific version
        PromptCache.get_instance().delete(name, version=int(version))
        # Invalidate latest prompt cache as well
        PromptCache.get_instance().delete(name, alias="latest")'''

old_delete = '''    @require_prompt_registry
    @translate_prompt_exception
    def delete_prompt_version_tag(self, name: str, version: str | int, key: str) -> None:
        """
        Delete a tag from a specific prompt version.

        Args:
            name: The name of the prompt.
            version: The version number of the prompt.
            key: The tag key to delete.
        """
        self._get_registry_client().delete_prompt_version_tag(name, version, key)

        # Invalidate cache for this specific version
        PromptCache.get_instance().delete(name, version=int(version))'''

new_delete = '''    @require_prompt_registry
    @translate_prompt_exception
    def delete_prompt_version_tag(self, name: str, version: str | int, key: str) -> None:
        """
        Delete a tag from a specific prompt version.

        Args:
            name: The name of the prompt.
            version: The version number of the prompt.
            key: The tag key to delete.
        """
        self._get_registry_client().delete_prompt_version_tag(name, version, key)

        # Invalidate cache for this specific version
        PromptCache.get_instance().delete(name, version=int(version))
        # Invalidate latest prompt cache as well
        PromptCache.get_instance().delete(name, alias="latest")'''

edits = [
    {"path": "mlflow/tracking/client.py", "old": old_set, "new": new_set},
    {"path": "mlflow/tracking/client.py", "old": old_delete, "new": new_delete},
]

print(json.dumps({"edits": edits}, indent=2))