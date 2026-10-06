# Release history
For each published update, increment dist/client/build-version.js and prepend an accurate release entry to PATCH_NOTES in dist/client/patch-notes.js. Preserve all previously published entries. The patch notes page must remain accessible from the main menu. Keep cache-busting versions aligned with BUILD_VERSION. Run npm test before publication.

# One published game version
The user requires GitHub JFeffe/Sigma2040 and the linked Site to contain the exact same game updates. Before publishing, reconcile the latest GitHub main and Site source, preserve all released corrections, run the required tests, and sync the complete validated changes to GitHub first. Verify every runtime file in dist/client/ and dist/server/ by Git blob hash against the resulting GitHub tree. Publish the Site from those identical files without subsequent product edits. Do not claim that GitHub and the game are synchronized unless both operations and the file comparison succeeded.
