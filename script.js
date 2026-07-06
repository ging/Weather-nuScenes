const PHOTOS_PER_PAGE = 5;

const viewerElement = document.getElementById("viewer");
const summaryElement = document.getElementById("dataset-summary");
const statusElements = [document.getElementById("pagination-status-top"), document.getElementById("pagination-status-bottom")];
const prevButtons = [document.getElementById("prev-page-top"), document.getElementById("prev-page-bottom")];
const nextButtons = [document.getElementById("next-page-top"), document.getElementById("next-page-bottom")];
const comparisonModal = document.getElementById("comparison-modal");
const comparisonCloseButton = document.getElementById("comparison-close");
const comparisonTitle = document.getElementById("comparison-title");
const comparisonOriginalImage = document.getElementById("comparison-original");
const comparisonVariantImage = document.getElementById("comparison-variant");
const CONDITIONS = ["0_originals", "fog", "night", "night_rain", "night_snow", "rain", "sandstorm", "snow"];
const CAMERAS = ["CAM_BACK", "CAM_BACK_LEFT", "CAM_BACK_RIGHT", "CAM_FRONT", "CAM_FRONT_LEFT", "CAM_FRONT_RIGHT"];

let currentPage = 1;
const manifest = window.DATASET_MANIFEST;

prevButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!manifest) {
      return;
    }

    currentPage = Math.max(1, currentPage - 1);
    renderPage();
  });
});

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!manifest) {
      return;
    }

    const totalPages = Math.max(1, Math.ceil(manifest.photos.length / PHOTOS_PER_PAGE));
    currentPage = Math.min(totalPages, currentPage + 1);
    renderPage();
  });
});

comparisonCloseButton.addEventListener("click", closeComparisonModal);
comparisonModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
    closeComparisonModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !comparisonModal.hidden) {
    closeComparisonModal();
  }
});

showWaitingState();
initializeViewer();

function renderPage() {
  if (!manifest) {
    showWaitingState();
    return;
  }

  const photos = manifest.photos;
  const conditions = CONDITIONS;
  const cameras = CAMERAS;
  const totalPages = Math.max(1, Math.ceil(photos.length / PHOTOS_PER_PAGE));
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const pagePhotos = photos.slice(startIndex, startIndex + PHOTOS_PER_PAGE);

  summaryElement.textContent = `${photos.length} photo groups • ${conditions.length} conditions • ${cameras.length} cameras`;
  statusElements.forEach((element) => {
    element.textContent = `Page ${currentPage} of ${totalPages} • Showing ${pagePhotos.length} photo grid${pagePhotos.length === 1 ? "" : "s"}`;
  });

  prevButtons.forEach((button) => {
    button.disabled = currentPage === 1;
  });
  nextButtons.forEach((button) => {
    button.disabled = currentPage === totalPages;
  });

  if (pagePhotos.length === 0) {
    viewerElement.innerHTML = '<div class="empty-state">No photos found in the manifest.</div>';
    return;
  }

  viewerElement.replaceChildren(...pagePhotos.map((photo, index) => buildPhotoCard(photo, startIndex + index + 1, conditions, cameras)));
}

function buildPhotoCard(photo, photoNumber, conditions, cameras) {
  const article = document.createElement("article");
  article.className = "photo-card";

  const header = document.createElement("header");
  header.className = "photo-card-header";

  const title = document.createElement("h2");
  title.textContent = `Photo ${photoNumber}`;

  const meta = document.createElement("p");
  meta.className = "photo-meta";
  meta.textContent = photo.group;

  header.append(title, meta);

  const scroll = document.createElement("div");
  scroll.className = "grid-scroll";

  const grid = document.createElement("div");
  grid.className = "photo-grid";
  grid.style.setProperty("--condition-count", conditions.length);

  grid.appendChild(buildLabelCell("grid-corner", "Camera / Condition"));
  conditions.forEach((condition) => {
    grid.appendChild(buildLabelCell("column-header", formatLabel(condition)));
  });

  cameras.forEach((camera) => {
    grid.appendChild(buildLabelCell("row-header", formatLabel(camera)));

    conditions.forEach((condition) => {
      const asset = buildAsset(photo, camera, condition);
      grid.appendChild(buildImageCell(asset));
    });
  });

  scroll.appendChild(grid);
  article.append(header, scroll);

  return article;
}

function buildLabelCell(className, text) {
  const cell = document.createElement("div");
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function buildImageCell(asset) {
  const cell = document.createElement("div");
  cell.className = "grid-cell";

  if (!asset) {
    const missing = document.createElement("div");
    missing.className = "missing-cell";
    missing.textContent = "Missing";
    cell.appendChild(missing);
    return cell;
  }

  const image = document.createElement("img");
  image.src = asset.path;
  image.alt = `${asset.camera} ${asset.condition} ${asset.filename}`;
  image.loading = "lazy";
  image.title = asset.filename;

  const actions = document.createElement("div");
  actions.className = "cell-actions";

  const compareButton = document.createElement("button");
  compareButton.className = "cell-compare-button";
  compareButton.type = "button";
  compareButton.textContent = "Compare";
  compareButton.title = asset.filename;
  compareButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openComparisonModal(asset);
  });

  actions.appendChild(compareButton);
  cell.dataset.hasImage = "true";
  cell.title = asset.filename;
  image.addEventListener("click", () => openComparisonModal(asset));

  cell.append(image, actions);
  return cell;
}

function formatLabel(value) {
  return value.replace(/^0_/, "").replace(/_/g, " ");
}

function buildAsset(photo, camera, condition) {
  const originalFilename = photo.originals?.[camera] ?? null;
  if (!originalFilename) {
    return null;
  }

  const filename = condition === "0_originals"
    ? originalFilename
    : appendConditionSuffix(originalFilename, condition);

  return {
    group: photo.group,
    camera,
    condition,
    filename,
    path: `dataset_test/${condition}/${camera}/${filename}`
  };
}

function appendConditionSuffix(filename, condition) {
  const extensionIndex = filename.lastIndexOf(".");
  if (extensionIndex === -1) {
    return `${filename}_${condition}`;
  }

  const basename = filename.slice(0, extensionIndex);
  const extension = filename.slice(extensionIndex);
  return `${basename}_${condition}${extension}`;
}

function showWaitingState() {
  viewerElement.innerHTML = "";
  summaryElement.textContent = "";
  statusElements.forEach((element) => {
    element.textContent = "";
  });
  prevButtons.forEach((button) => {
    button.disabled = true;
  });
  nextButtons.forEach((button) => {
    button.disabled = true;
  });
}

function initializeViewer() {
  try {
    if (!manifest || !Array.isArray(manifest.photos)) {
      throw new Error("Manifest missing or invalid.");
    }

    currentPage = 1;
    renderPage();
  } catch (error) {
    console.error(error);
    viewerElement.innerHTML = '<div class="empty-state">Could not start the viewer.</div>';
    summaryElement.textContent = "";
    statusElements.forEach((element) => {
      element.textContent = "Start failed";
    });
    prevButtons.forEach((button) => {
      button.disabled = true;
    });
    nextButtons.forEach((button) => {
      button.disabled = true;
    });
  }
}

function openComparisonModal(asset) {
  const originalAsset = buildAsset(findPhotoByGroup(asset.group), asset.camera, "0_originals");
  if (!originalAsset) {
    return;
  }

  comparisonTitle.textContent = `${asset.camera} • ${formatLabel(asset.condition)} • ${asset.filename}`;
  comparisonOriginalImage.src = originalAsset.path;
  comparisonOriginalImage.alt = originalAsset.filename;
  comparisonVariantImage.src = asset.path;
  comparisonVariantImage.alt = asset.filename;
  comparisonModal.hidden = false;
}

function closeComparisonModal() {
  comparisonModal.hidden = true;
  comparisonOriginalImage.removeAttribute("src");
  comparisonVariantImage.removeAttribute("src");
}

function findPhotoByGroup(group) {
  return manifest.photos.find((photo) => photo.group === group) ?? null;
}