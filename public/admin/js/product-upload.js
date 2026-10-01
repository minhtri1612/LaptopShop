document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-presign-upload]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    const fileInput = form.querySelector('input[type="file"][name="image"]');
    const hidden = form.querySelector('input[name="imageUrl"]');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!file || !hidden) return;

    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      const response = await fetch('/admin/product-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type || 'image/jpeg', size: file.size }),
      });
      if (!response.ok) throw new Error('upload url failed');
      const data = await response.json();
      const put = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': data.contentType },
        body: file,
      });
      if (!put.ok) throw new Error('s3 put failed');
      hidden.value = data.publicUrl;
      fileInput.removeAttribute('name');
      form.submit();
    } catch (error) {
      if (button) button.disabled = false;
      alert('Upload failed');
    }
  });
});
