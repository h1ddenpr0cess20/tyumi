/**
 * Image upload and attachment handling
 */

window.pendingUploads = [];

window.initImageUploads = function() {
  const uploadInput = document.getElementById('image-upload');
  const uploadButton = document.getElementById('upload-button');
  if (!uploadInput || !uploadButton) return;

  uploadButton.addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    window.pendingUploads = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await readFileAsDataURL(file);
      window.pendingUploads.push({ file, dataUrl });
    }
    if (typeof window.showPendingUploadPreviews === 'function') {
      window.showPendingUploadPreviews();
    }
    uploadInput.value = '';
  });
};

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.showPendingUploadPreviews = function() {
  const wrapper = document.querySelector('.input-wrapper');
  if (!wrapper) return;
  let preview = wrapper.querySelector('.upload-previews');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'upload-previews';
    wrapper.insertBefore(preview, wrapper.firstChild);
  }
  preview.innerHTML = '';
  window.pendingUploads.forEach(up => {
    const img = document.createElement('img');
    img.src = up.dataUrl;
    img.alt = 'Upload preview';
    img.className = 'upload-preview-img';
    preview.appendChild(img);
  });
};

