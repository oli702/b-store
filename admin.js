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
let orders = [];
let ordersLoaded = false;

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
  document.getElementById('adminIdentity').textContent = user ? 'Session administrateur active' : '';
  if (!user) {
    orders = [];
    ordersLoaded = false;
    document.getElementById('ordersList').innerHTML = '<p class="inventory-empty">Ouvre l’onglet pour charger les commandes.</p>';
  }
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

const paymentStatusLabels = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
  refunded: 'Remboursé'
};
const deliveryStatusLabels = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  shipping: 'En livraison',
  delivered: 'Livrée',
  canceled: 'Annulée'
};
const paymentMethodLabels = {
  wave: 'Wave',
  orange: 'Orange Money',
  mtn: 'MTN MoMo',
  cash: 'Paiement à la livraison'
};
const fulfillmentMethodLabels = {
  delivery: 'Livraison',
  pickup: 'Retrait à Saaba'
};

function renderOrderCard(order) {
  const phoneDigits = String(order.customer_phone || '').replace(/\D/g, '');
  const items = Array.isArray(order.items) ? order.items : [];
  const itemSummary = items.map((item) => {
    const options = [
      item.color ? `Coloris : ${item.color}` : '',
      item.size ? `${item.sizeLabel || 'Taille'} : ${item.size}` : ''
    ].filter(Boolean);
    return `<li>${escapeHtml(item.name)} × ${Number(item.qty) || 0}${options.length ? ` <span>(${escapeHtml(options.join(', '))})</span>` : ''}</li>`;
  }).join('');

  return `
    <article class="order-card" data-order-id="${escapeHtml(order.id)}">
      <header class="order-card__header">
        <div>
          <strong class="order-reference">${escapeHtml(order.order_ref)}</strong>
          <span class="order-date">${escapeHtml(new Date(order.created_at).toLocaleString('fr-FR'))}</span>
        </div>
        <strong class="order-total">${formatPrice(order.total)}</strong>
      </header>
      <div class="order-card__customer">
        <strong>${escapeHtml(order.customer_name)}</strong>
        <span>${escapeHtml(order.customer_phone)} · ${escapeHtml(paymentMethodLabels[order.payment_method] || order.payment_method)}</span>
        ${order.customer_email ? `<span>${escapeHtml(order.customer_email)}</span>` : ''}
        <span>${order.fulfillment_method === 'pickup'
    ? 'Retrait sur place à Saaba'
    : `${escapeHtml(order.delivery_address)}, ${escapeHtml(order.delivery_city)}, ${escapeHtml(order.delivery_country)}`}</span>
      </div>
      <ul class="order-card__items">${itemSummary}</ul>
      ${order.notes ? `<p class="order-notes"><strong>Note :</strong> ${escapeHtml(order.notes)}</p>` : ''}
      <div class="order-card__tracking">
        <label>
          <span>Paiement</span>
          <select data-field="payment_status">
            ${Object.entries(paymentStatusLabels).map(([value, label]) => `<option value="${value}" ${order.payment_status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>Livraison</span>
          <select data-field="delivery_status">
            ${Object.entries(deliveryStatusLabels).map(([value, label]) => `<option value="${value}" ${order.delivery_status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>
        <label class="transaction-reference">
          <span>Référence transaction</span>
          <input data-field="transaction_reference" type="text" maxlength="160" value="${escapeHtml(order.transaction_reference || '')}" placeholder="Wave / Orange Money">
        </label>
      </div>
      <footer class="order-card__footer">
        <div class="order-card__contact">
          ${phoneDigits ? `<a class="admin-button admin-button--secondary" href="https://wa.me/${encodeURIComponent(phoneDigits)}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="admin-button admin-button--secondary" href="tel:${phoneDigits}">Appeler</a>` : ''}
        </div>
        <button class="admin-button" type="button" data-save-order>Enregistrer le suivi</button>
      </footer>
    </article>
  `;
}

function getFilteredOrders() {
  const query = document.getElementById('orderSearch').value.trim().toLocaleLowerCase('fr');
  const paymentStatus = document.getElementById('paymentFilter').value;
  const deliveryStatus = document.getElementById('deliveryFilter').value;
  return orders.filter((order) => {
    const matchesQuery = !query || [order.order_ref, order.customer_name, order.customer_phone]
      .some((value) => String(value || '').toLocaleLowerCase('fr').includes(query));
    return matchesQuery
      && (!paymentStatus || order.payment_status === paymentStatus)
      && (!deliveryStatus || order.delivery_status === deliveryStatus);
  });
}

function renderOrders() {
  document.getElementById('newOrderCount').textContent = String(orders.filter((order) => order.delivery_status === 'new').length);
  document.getElementById('collectedAmount').textContent = formatPrice(
    orders.filter((order) => order.payment_status === 'paid').reduce((total, order) => total + Number(order.total || 0), 0)
  );
  document.getElementById('outstandingAmount').textContent = formatPrice(
    orders.filter((order) => ['pending', 'failed'].includes(order.payment_status))
      .reduce((total, order) => total + Number(order.total || 0), 0)
  );

  const filteredOrders = getFilteredOrders();
  document.getElementById('ordersCount').textContent = `${filteredOrders.length} commande${filteredOrders.length > 1 ? 's' : ''}`;
  document.getElementById('ordersList').innerHTML = filteredOrders.length
    ? filteredOrders.map(renderOrderCard).join('')
    : '<p class="inventory-empty">Aucune commande ne correspond à ces critères.</p>';
}

async function loadOrders() {
  const ordersList = document.getElementById('ordersList');
  ordersList.innerHTML = '<p class="inventory-empty">Chargement des commandes…</p>';
  orders = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + 999);
    if (error) throw error;
    orders.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  ordersLoaded = true;
  renderOrders();
}

function exportOrdersCsv() {
  const columns = [
    ['Référence', 'order_ref'],
    ['Date', 'created_at'],
    ['Nom', 'customer_name'],
    ['Téléphone', 'customer_phone'],
    ['Email', 'customer_email'],
    ['Adresse', 'delivery_address'],
    ['Ville', 'delivery_city'],
    ['Pays', 'delivery_country'],
    ['Mode de remise', 'fulfillment_method'],
    ['Articles', 'items'],
    ['Sous-total', 'subtotal'],
    ['Livraison', 'shipping_fee'],
    ['Total', 'total'],
    ['Mode de paiement', 'payment_method'],
    ['Statut paiement', 'payment_status'],
    ['Statut livraison', 'delivery_status'],
    ['Référence transaction', 'transaction_reference'],
    ['Notes', 'notes']
  ];
  const csvValue = (value) => {
    const text = String(value ?? '');
    const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const rows = orders.map((order) => columns.map(([, key]) => {
    if (key === 'items') {
      return csvValue((order.items || []).map((item) => `${item.name} × ${item.qty}`).join('; '));
    }
    if (key === 'payment_method') return csvValue(paymentMethodLabels[order[key]] || order[key]);
    if (key === 'fulfillment_method') return csvValue(fulfillmentMethodLabels[order[key]] || order[key]);
    if (key === 'payment_status') return csvValue(paymentStatusLabels[order[key]] || order[key]);
    if (key === 'delivery_status') return csvValue(deliveryStatusLabels[order[key]] || order[key]);
    return csvValue(order[key]);
  }).join(','));
  const csv = `\uFEFF${columns.map(([label]) => csvValue(label)).join(',')}\r\n${rows.join('\r\n')}`;
  const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `bstore-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}

document.querySelectorAll('[data-admin-view]').forEach((button) => {
  button.addEventListener('click', async () => {
    const ordersViewSelected = button.dataset.adminView === 'orders';
    document.getElementById('inventoryView').hidden = ordersViewSelected;
    document.getElementById('ordersView').hidden = !ordersViewSelected;
    document.querySelectorAll('[data-admin-view]').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });

    if (ordersViewSelected) {
      try {
        await loadOrders();
      } catch (error) {
        ordersLoaded = false;
        document.getElementById('ordersList').innerHTML = '<p class="inventory-empty">Impossible de charger les commandes. Vérifie la configuration SQL et réessaie.</p>';
        showStatus(error.message || 'Impossible de charger les commandes.', 'error');
      }
    }
  });
});

['orderSearch', 'paymentFilter', 'deliveryFilter'].forEach((id) => {
  const filter = document.getElementById(id);
  if (!filter) return;
  filter.addEventListener('input', renderOrders);
  filter.addEventListener('change', renderOrders);
});

const refreshOrdersButton = document.getElementById('refreshOrders');
if (refreshOrdersButton) {
  refreshOrdersButton.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await loadOrders();
      showStatus('Commandes actualisées.');
    } catch (error) {
      showStatus(error.message || 'Impossible d’actualiser les commandes.', 'error');
    } finally {
      button.disabled = false;
    }
  });
}

const exportOrdersButton = document.getElementById('exportOrders');
if (exportOrdersButton) exportOrdersButton.addEventListener('click', () => {
  if (!ordersLoaded) {
    showStatus('Charge les commandes avant de les exporter.', 'error');
    return;
  }
  if (!orders.length) {
    showStatus('Aucune commande à exporter.', 'error');
    return;
  }
  exportOrdersCsv();
});

const ordersList = document.getElementById('ordersList');
if (ordersList) ordersList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-save-order]');
  if (!button) return;
  const card = button.closest('[data-order-id]');
  if (!card) return;
  button.disabled = true;

  try {
    const id = card.dataset.orderId;
    const { error } = await client
      .from('orders')
      .update({
        payment_status: card.querySelector('[data-field="payment_status"]').value,
        delivery_status: card.querySelector('[data-field="delivery_status"]').value,
        transaction_reference: card.querySelector('[data-field="transaction_reference"]').value.trim()
      })
      .eq('id', id);
    if (error) throw error;
    await loadOrders();
    showStatus(`Suivi de la commande ${card.querySelector('.order-reference').textContent} enregistré.`);
  } catch (error) {
    showStatus(error.message || 'Impossible d’enregistrer le suivi de la commande.', 'error');
  } finally {
    button.disabled = false;
  }
});

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
