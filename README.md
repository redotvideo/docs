# Revideo Docs

This is the new documentation repository for Revideo. We used to use Docusaurus for this, and kept the docs in the same repository as Revideo itself. As part of the big 0.10.0 refactor, the old docs became incompatible with Revideo, which is why we decided to move them to a separate repository and migrate them to Nextra while we're at it. This will also allow us to use Nextra for the rest of the website in the future.

The `/scripts` directory contains a migration script that converts the old docs to the new format. The old docs are in the `/old-docs` directory. For now, we'll make changes to the old docs folder, and then run the script to convert them to the new format.

This is a work in progress.

### TODO

These are just some of the things that are currently missing:

-   [ ] Deploy to a temporarysubdomain (maybe new.docs.re.video)
-   [ ] Update header of nextra template and make it pretty
-   [ ] Fix order of sidebar
-   [ ] Add redirects for old docs
-   [ ] Fix preview of Revideo code
-   [ ] Add search
-   [ ] Add analytics
