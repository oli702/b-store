const config = window.BSTORE_SUPABASE_CONFIG || {};
const statusElement = document.getElementById('adminStatus');
const loginPanel = document.getElementById('adminLoginPanel');
const dashboard = document.getElementById('adminDashboard');
const inventoryList = document.getElementById('inventoryList');
const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('productFormTitle');
const client = window.supabase && config.url && config.anonKey
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;

let products = [];

function showStatus(message, kind = 'success') {
  statusElement.textContent = message;
  statusElement.dataset.kind = kind;
  statusElement.hidden = false;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
}

function validateImageUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Renseigne une adresse d’image valide.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('L’adresse de l’image doit utiliser HTTP ou HTTPS.');
  }
  return url.href;
}

function setBusy(form, busy) {
  form.querySelectorAll('button').forEach((button) => {
    button.disabled = busy;
  });
}

function setAuthenticated(user) {
  loginPanel.hidden = Boolean(user);
  dashboard.hidden = !user;
  document.getElementById('adminIdentity').textContent = user ? user.email : '';
}

async function verifyAdmin(user) {
  const { data, error } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    await client.auth.signOut();
    setAuthenticated(null);
    throw new Error('Ce compte Google/Supabase n’a pas les droits administrateur.');
  }

  setAuthenticated(user);
  await loadInventory();
}

function renderInventory() {
  document.getElementById('productCount').textContent = `${products.length} produit${products.length > 1 ? 's' : ''}`;
  if (!products.length) {
    inventoryList.innerHTML = '<p class="inventory-empty">Aucun produit enregistré. Ajoute ton premier article avec le formulaire.</p>';
    return;
  }

  inventoryList.innerHTML = products.map((product) => `
    <article class="inventory-item">
      <img class="inventory-item__image" src="${escapeHtml(product.image_url)}" alt="">
      <div class="inventory-item__details">
        <strong>${escapeHtml(product.name)}</strong>
        <span>${formatPrice(product.price)} · Stock : ${Number(product.stock)} · ${product.active ? 'Publié' : 'Masqué'}</span>
      </div>
      <div class="inventory-item__actions">
        <button class="admin-button admin-button--secondary" type="button" data-edit="${escapeHtml(product.id)}">Modifier</button>
        <button class="admin-button ${product.active ? 'is-inactive' : ''}" type="button" data-toggle="${escapeHtml(product.id)}">${product.active ? 'Masquer' : 'Publier'}</button>
      </div>
    </article>
  `).join('');
}

async function loadInventory() {
  inventoryList.innerHTML = '<p class="inventory-empty">Chargement de l’inventaire…</p>';
  const { data, error } = await client.rpc('get_admin_products');
  if (error) throw error;
  products = data || [];
  renderInventory();
}

function resetProductForm() {
  productForm.reset();
  document.getElementById('productId').value = '';
  document.getElementById('productActive').checked = true;
  document.getElementById('productImageUrl').value = '';
  document.getElementById('productImageFile').value = '';
  formTitle.textContent = 'Ajouter un produit';
  document.getElementById('cancelProductEdit').hidden = true;
}

function editProduct(product) {
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = String(product.price);
  document.getElementById('productStock').value = String(product.stock);
  document.getElementById('productSizes').value = (product.sizes || []).join(', ');
  document.getElementById('productImageUrl').value = product.image_url;
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productActive').checked = Boolean(product.active);
  document.getElementById('productImageFile').value = '';
  formTitle.textContent = 'Modifier le produit';
  document.getElementById('cancelProductEdit').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function uploadProductImage(file) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Choisis un fichier image valide.');
  if (file.size > 5 * 1024 * 1024) throw new Error('La photo doit faire 5 Mo maximum.');

  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await client.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;

  const { data } = client.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setBusy(productForm, true);

  try {
    const id = document.getElementById('productId').value;
    const file = document.getElementById('productImageFile').files[0];
    const existing = products.find((product) => product.id === id);
    const enteredImageUrl = document.getElementById('productImageUrl').value.trim();
    const imageUrl = await uploadProductImage(file)
      || (enteredImageUrl ? validateImageUrl(enteredImageUrl) : existing?.image_url);
    if (!imageUrl) throw new Error('Ajoute une photo ou renseigne l’adresse de l’image.');

    const sizes = document.getElementById('productSizes').value
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean);
    const product = {
      name: document.getElementById('productName').value.trim(),
      category: document.getElementById('productCategory').value,
      price: Number(document.getElementById('productPrice').value),
      stock: Number(document.getElementById('productStock').value),
      image_url: imageUrl,
      description: document.getElementById('productDescription').value.trim(),
      sizes,
      active: document.getElementById('productActive').checked,
      updated_at: new Date().toISOString()
    };

    const result = id
      ? await client.from('products').update(product).eq('id', id)
      : await client.from('products').insert(product);
    if (result.error) throw result.error;

    resetProductForm();
    await loadInventory();
    showStatus(id ? 'Produit mis à jour.' : 'Produit ajouté à la boutique.');
  } catch (error) {
    showStatus(error.message || 'Impossible d’enregistrer le produit.', 'error');
  } finally {
    setBusy(productForm, false);
  }
});

inventoryList.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    const product = products.find((item) => item.id === editButton.dataset.edit);
    if (product) editProduct(product);
    return;
  }

  const toggleButton = event.target.closest('[data-toggle]');
  if (!toggleButton) return;
  toggleButton.disabled = true;

  try {
    const product = products.find((item) => item.id === toggleButton.dataset.toggle);
    if (!product) return;
    const { error } = await client
      .from('products')
      .update({ active: !product.active, updated_at: new Date().toISOString() })
      .eq('id', product.id);
    if (error) throw error;
    await loadInventory();
    showStatus(product.active ? 'Produit masqué de la boutique.' : 'Produit publié dans la boutique.');
  } catch (error) {
    showStatus(error.message || 'Impossible de modifier la publication du produit.', 'error');
  } finally {
    toggleButton.disabled = false;
  }
});

document.getElementById('adminLoginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!client) {
    showStatus('Supabase n’est pas encore configuré. Suis les étapes du guide ADMIN_SUPABASE.md.', 'error');
    return;
  }
  const form = event.currentTarget;
  setBusy(form, true);

  try {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await verifyAdmin(data.user);
    showStatus('Connexion administrateur réussie.');
  } catch (error) {
    showStatus(error.message || 'Connexion impossible.', 'error');
  } finally {
    setBusy(form, false);
  }
});

document.getElementById('adminLogout').addEventListener('click', async () => {
  const { error } = await client.auth.signOut();
  if (error) {
    showStatus(error.message, 'error');
    return;
  }
  setAuthenticated(null);
  showStatus('Tu es déconnecté.');
});

document.getElementById('cancelProductEdit').addEventListener('click', resetProductForm);

async function initializeAdmin() {
  if (!config.url || !config.anonKey) {
    document.querySelector('#adminLoginForm button[type="submit"]').disabled = true;
    showStatus('Supabase n’est pas encore configuré. Suis les étapes du guide ADMIN_SUPABASE.md.', 'error');
    return;
  }
  if (!window.supabase?.createClient) {
    document.querySelector('#adminLoginForm button[type="submit"]').disabled = true;
    showStatus('La bibliothèque Supabase n’a pas pu être chargée. Vérifie ta connexion puis actualise la page.', 'error');
    return;
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await verifyAdmin(data.session.user);
  } catch (error) {
    setAuthenticated(null);
    showStatus(error.message || 'Impossible de charger la session administrateur.', 'error');
  }
}

initializeAdmin();
