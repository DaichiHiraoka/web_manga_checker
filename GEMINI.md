# Gemini CLI Development Workflow for web_manga_checker

This document outlines the development workflow that Gemini CLI must follow for this project.

## Branching Strategy

The repository uses the following branches:

-   `main`: Stores the stable, production-ready code. Direct pushes are forbidden. Merges only from development branches via pull requests.
-   `development[version]`: (e.g., `development0.1.0`) A branch for integrating features for a specific release version.
-   `feature/[issue-number]-[short-description]`: (e.g., `feature/123-add-filtering`) Branches for developing new features.

## Issue Management

All new features and significant changes must begin with the creation of a GitHub issue.  
Feature branches may only be created after the corresponding issue has been registered and described in the issue tracker.

0.  **Create an Issue:**
    -   Any new feature or significant change must start with creating a new issue in the GitHub issue tracker.
    -   The issue should describe the purpose and requirements of the feature.


## Feature Implementation Workflow

When implementing a new feature, the following steps must be strictly followed:

1.  **Create a Feature Branch:**
    -   A new feature branch must be created from the latest `development[version]` branch.
    -   The branch name must follow the pattern: `feature/[issue-number]-[short-description]`. If there is no associated issue number, a descriptive name should be used.

2.  **Implement the Feature:**
    -   All development and commits for the feature must be done on this feature branch.
    -   Commit messages should be descriptive and follow conventional commit standards (e.g., `feat:`, `fix:`, `docs:`).

3.  **Open a Pull Request:**
    -   Once the feature is complete and tested, a pull request must be opened to merge the feature branch into the corresponding `development[version]` branch.
    -   Gemini CLI will notify the user that the pull request is ready for review.

4.  **Merge and Cleanup:**
    -   After the user approves and merges the pull request, Gemini CLI will switch back to the `development[version]` branch and pull the latest changes.
    -   The local feature branch should be deleted.
