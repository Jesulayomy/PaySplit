
# Change Log
All notable changes to this project will be documented in this file. Include your changes above the most recent log, the `last` changelog is a template to follow.


---

> 05/12/2025
```markdown
## PaySplit Enhancements
[PaySplit]: | Comprehensive updates to PaySplit.

Summary: This update introduces significant improvements across the PaySplit application, including new features, bug fixes, and enhancements to the look, feel, responsiveness, and accessibility of the application.

### Added
- Installed `multer` and `google/genai` for receipt processing.
- Added item schema for receipt items and routes for image processing with AI.
- Implemented profile images using Cloudinary.
- Added default image fallback for profiles.
- Added edit route and controller function for contributions.
- Implemented item selection for contributions with receipts.
- Added sorting logic for invites and completed items.

### Changed
- Migrated app to use MVC framework.
- Modified passport strategies and added image uploads with AI receipt scanning.
- Updated `/spend` route to `/profile`.
- Updated views to handle image input and render receipt data.
- Modified views to use new references and updated responsiveness at various breakpoints.
- Condensed `myContrib` and `contrib.ejs` views.

### Fixed
- Fixed buttons and behavior to match model representation.
- Fixed route data for contribution model and equal split.
- Reconfigured models to save in document only, removing unnecessary depth.
- Implemented a "Not Found" page for various routes and as a fallback.
```


---
```markdown
## Omelettes vs Egg wars
PR Title: [One-TwoWordIdea]: A shorter descriptive message.

Summary: More context...

### Added
- An Egg

### Changed
- Eggs to omelettes

### Fixed
- Egg shape
```