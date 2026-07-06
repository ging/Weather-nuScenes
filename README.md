# Weather-nuScenes Dataset Grid Viewer

This project is a static image viewer for the `dataset_test` folder with a sample of the Weather-nuScenes dataset that can be accessed in: [https://doi.org/10.5281/zenodo.21135950](https://doi.org/10.5281/zenodo.21135950)

It shows:

- weather conditions on the X axis
- cameras on the Y axis
- one comparison grid per photo group
- pagination with 5 photo groups per page

## How to open the viewer

The viewer is fully static.

1. Open [index.html](./index.html) with a double click.
2. The page loads [manifest.js](./manifest.js) directly.
3. Images are resolved from the `dataset_test` folder using relative paths.

No server is required.

## Project files

- [index.html](./index.html): page structure
- [styles.css](./styles.css): layout and visual styling
- [script.js](./script.js): grid rendering, pagination, hover actions, and comparison modal
- [manifest.js](./manifest.js): static data used by the viewer
- [build_manifest.js](./build_manifest.js): script that updates `manifest.js`

## How `manifest.js` works

The manifest is built from the image order in `dataset_test/0_originals`.

It stores:

- `photos`: array of photo groups
- `group`: the unique row id for that image index
- `originals`: the original filename for each camera

The viewer builds the rest of the file paths in the browser from those original names.

## Updating the manifest

If you add new files to `dataset_test`, run:

```bash
node build_manifest.js
```

What the script does:

- scans `dataset_test/0_originals`
- sorts the images in each camera folder
- uses the image position to create one group per row
- updates [manifest.js](./manifest.js)
- writes one manifest entry per image index

## Expected dataset structure

The viewer expects this structure:

```text
dataset_test/
  0_originals/
    CAM_BACK/
    CAM_BACK_LEFT/
    CAM_BACK_RIGHT/
    CAM_FRONT/
    CAM_FRONT_LEFT/
    CAM_FRONT_RIGHT/
  fog/
  night/
  night_rain/
  night_snow/
  rain/
  sandstorm/
  snow/
```

The browser code derives variant filenames from the original image names using the current naming pattern.
