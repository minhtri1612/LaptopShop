document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-presign-upload]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    const fileField = form.dataset.fileField || 'image';
    const urlField = form.dataset.urlField || 'imageUrl';
    const ticketUrl = form.dataset.uploadUrl || '/admin/product-upload-url';
    const fileInput = form.querySelector(`input[type="file"][name="${fileField}"]`);
    const hidden = form.querySelector(`input[name="${urlField}"]`);
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!file || !hidden) return;

    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      const response = await fetch(ticketUrl, {
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
});
