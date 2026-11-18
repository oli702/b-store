const config = window.BSTORE_SUPABASE_CONFIG || {};
const statusElement = document.getElementById('adminStatus');
const loginPanel = document.getElementById('adminLoginPanel');
const dashboard = document.getElementById('adminDashboard');
const productForm = document.getElementById('productForm');
const inventoryList = document.getElementById('inventoryList');
const client = window.supabase && config.url && config.anonKey
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;

let products = [];
let orders = [];
let ordersLoaded = false;

const paymentLabels = { pending: 'En attente', paid: 'Payé', failed: 'Échoué', refunded: 'Remboursé' };
const deliveryLabels = { new: 'Nouvelle', confirmed: 'Confirmée', shipping: 'En livraison', delivered: 'Livrée', canceled: 'Annulée' };

function showStatus(message, kind = 'success') {
  statusElement.textContent = message;
  statusElement.dataset.kind = kind;
  statusElement.hidden = !message;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
}

function setAuthenticated(user) {
  loginPanel.hidden = Boolean(user);
  dashboard.hidden = !user;
  document.getElementById('adminIdentity').textContent = user ? 'Session administrateur active' : '';
  if (!user) {
    orders = [];
    ordersLoaded = false;
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
    throw new Error('Ce compte n’est pas autorisé à accéder à l’administration.');
  }
  setAuthenticated(user);
  await loadInventory();
}

function renderInventory() {
  if (!products.length) {
    inventoryList.innerHTML = '<p class="inventory-empty">Aucun produit enregistré.</p>';
    return;
  }
  inventoryList.innerHTML = products.map((product) => `
    <article class="inventory-card">
      <img src="${escapeHtml(product.image_url)}" alt="" loading="lazy">
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${formatPrice(product.price)} · Stock : ${Number(product.stock)} · ${product.active ? 'Publié' : 'Masqué'}</p>
        <p>${escapeHtml(product.category)}</p>
      </div>
      <div class="inventory-card__actions">
        <button class="admin-button admin-button--secondary" type="button" data-edit-product="${escapeHtml(product.id)}">Modifier</button>
        <button class="admin-button admin-button--secondary" type="button" data-toggle-product="${escapeHtml(product.id)}">${product.active ? 'Masquer' : 'Publier'}</button>
      </div>
    </article>`).join('');
}

async function loadInventory() {
  inventoryList.innerHTML = '<p class="inventory-empty">Chargement des produits…</p>';
  const { data, error } = await client.rpc('get_admin_products');
  if (error) throw error;
  products = data || [];
  renderInventory();
}

function resetProductForm() {
  productForm.reset();
  document.getElementById('productId').value = '';
  document.getElementById('productActive').checked = true;
  document.getElementById('productFormTitle').textContent = 'Ajouter un produit';
  document.getElementById('cancelProductEdit').hidden = true;
}

function renderOrders() {
  const query = document.getElementById('orderSearch').value.trim().toLocaleLowerCase('fr');
  const paymentFilter = document.getElementById('paymentFilter').value;
  const deliveryFilter = document.getElementById('deliveryFilter').value;
  const filtered = orders.filter((order) => {
    const searchText = `${order.order_ref} ${order.customer_name} ${order.customer_phone}`.toLocaleLowerCase('fr');
    return (!query || searchText.includes(query))
      && (!paymentFilter || order.payment_status === paymentFilter)
      && (!deliveryFilter || order.delivery_status === deliveryFilter);
  });
  document.getElementById('ordersCount').textContent = `${filtered.length} commande${filtered.length === 1 ? '' : 's'}`;
  document.getElementById('newOrderCount').textContent =
    orders.filter((order) => order.delivery_status === 'new').length.toLocaleString('fr-FR');
  document.getElementById('collectedAmount').textContent = formatPrice(
    orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + Number(order.total), 0)
  );
  document.getElementById('outstandingAmount').textContent = formatPrice(
    orders.filter((order) => order.payment_status === 'pending').reduce((sum, order) => sum + Number(order.total), 0)
  );

  if (!filtered.length) {
    document.getElementById('ordersList').innerHTML = '<p class="inventory-empty">Aucune commande ne correspond aux critères.</p>';
    return;
  }
  document.getElementById('ordersList').innerHTML = filtered.map((order) => {
    const phoneDigits = String(order.customer_phone || '').replace(/\D/g, '');
    const items = (order.items || []).map((item) =>
      `${escapeHtml(item.name)} × ${Number(item.qty)}${item.size ? ` · ${escapeHtml(item.sizeLabel || 'Taille')} ${escapeHtml(item.size)}` : ''}${item.color ? ` · ${escapeHtml(item.color)}` : ''}`
    ).join('<br>');
    const address = order.fulfillment_method === 'pickup'
      ? 'Retrait sur place à Saaba'
      : [order.delivery_address, order.delivery_city, order.delivery_country].filter(Boolean).map(escapeHtml).join(', ');
    return `<article class="order-card" data-order-id="${escapeHtml(order.id)}">
      <div class="order-card__top">
        <div><h3 class="order-reference">${escapeHtml(order.order_ref)}</h3>
        <p class="admin-muted">${escapeHtml(new Date(order.created_at).toLocaleString('fr-FR'))}</p></div>
        <strong class="order-total">${formatPrice(order.total)}</strong>
      </div>
      <div class="order-card__details">
        <p><strong>Client :</strong> ${escapeHtml(order.customer_name)}<br><strong>Téléphone :</strong> ${escapeHtml(order.customer_phone)}</p>
        <p><strong>Remise :</strong> ${escapeHtml(address || 'Non précisée')}<br><strong>Paiement :</strong> ${escapeHtml(order.payment_method)}</p>
        <p class="order-items"><strong>Articles :</strong><br>${items || 'Détails indisponibles'}</p>
        <p><strong>Sous-total :</strong> ${formatPrice(order.subtotal)}<br><strong>Frais de remise :</strong> ${formatPrice(order.shipping_fee)}</p>
      </div>
      <div class="order-card__controls">
        <label>Paiement<select data-field="payment_status">
          ${Object.entries(paymentLabels).map(([value, label]) => `<option value="${value}" ${order.payment_status === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select></label>
        <label>Remise<select data-field="delivery_status">
          ${Object.entries(deliveryLabels).map(([value, label]) => `<option value="${value}" ${order.delivery_status === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select></label>
        <label>Référence transaction<input data-field="transaction_reference" maxlength="160" value="${escapeHtml(order.transaction_reference || '')}" placeholder="Wave / Orange Money"></label>
      </div>
      <div class="order-card__footer">
        <div class="order-links">${phoneDigits ? `<a href="https://wa.me/${encodeURIComponent(phoneDigits)}" target="_blank" rel="noopener noreferrer">WhatsApp client</a><a href="tel:${encodeURIComponent(order.customer_phone)}">Appeler</a>` : ''}</div>
        <button class="admin-button" type="button" data-save-order>Enregistrer le suivi</button>
      </div>
    </article>`;
  }).join('');
}

async function loadOrders() {
  const list = document.getElementById('ordersList');
  list.innerHTML = '<p class="inventory-empty">Chargement des commandes…</p>';
  const pageSize = 500;
  const result = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from('orders')
      .select('id, order_ref, customer_name, customer_phone, fulfillment_method, delivery_address, delivery_city, delivery_country, payment_method, payment_status, delivery_status, transaction_reference, items, subtotal, shipping_fee, total, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  orders = result;
  ordersLoaded = true;
  renderOrders();
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportOrdersCsv() {
  const headers = ['Référence', 'Date', 'Client', 'Téléphone', 'Mode de remise', 'Adresse', 'Articles', 'Paiement', 'Statut paiement', 'Statut remise', 'Référence transaction', 'Total'];
  const rows = orders.map((order) => [
    order.order_ref,
    new Date(order.created_at).toLocaleString('fr-FR'),
    order.customer_name,
    order.customer_phone,
    order.fulfillment_method,
    [order.delivery_address, order.delivery_city, order.delivery_country].filter(Boolean).join(', '),
    (order.items || []).map((item) => `${item.name} x${item.qty}`).join('; '),
    order.payment_method,
    paymentLabels[order.payment_status] || order.payment_status,
    deliveryLabels[order.delivery_status] || order.delivery_status,
    order.transaction_reference,
    order.total
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `commandes-b-store-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

document.getElementById('adminLoginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  if (!client) {
    showStatus('Supabase n’est pas configuré. Renseigne supabase-config.js avec l’URL du projet et la clé publishable.', 'error');
    return;
  }
  button.disabled = true;
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
    button.disabled = false;
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

document.querySelectorAll('[data-admin-view]').forEach((button) => {
  button.addEventListener('click', async () => {
    const showOrders = button.dataset.adminView === 'orders';
    document.getElementById('inventoryView').hidden = showOrders;
    document.getElementById('ordersView').hidden = !showOrders;
    document.querySelectorAll('[data-admin-view]').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    if (showOrders && !ordersLoaded) {
      try { await loadOrders(); }
      catch (error) { showStatus(error.message || 'Impossible de charger les commandes.', 'error'); }
    }
  });
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = productForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const id = document.getElementById('productId').value;
    const imageUrl = new URL(document.getElementById('productImage').value.trim());
    if (!['http:', 'https:'].includes(imageUrl.protocol)) throw new Error('La photo doit utiliser une adresse HTTP ou HTTPS.');
    const product = {
      name: document.getElementById('productName').value.trim(),
      category: document.getElementById('productCategory').value,
      price: Number(document.getElementById('productPrice').value),
      stock: Number(document.getElementById('productStock').value),
      image_url: imageUrl.href,
      sizes: document.getElementById('productSizes').value.split(',').map((value) => value.trim()).filter(Boolean),
      description: document.getElementById('productDescription').value.trim(),
      active: document.getElementById('productActive').checked,
      updated_at: new Date().toISOString()
    };
    const result = id
      ? await client.from('products').update(product).eq('id', id)
      : await client.from('products').insert(product);
    if (result.error) throw result.error;
    resetProductForm();
    await loadInventory();
    showStatus(id ? 'Produit mis à jour.' : 'Produit ajouté.');
  } catch (error) {
    showStatus(error.message || 'Impossible d’enregistrer le produit.', 'error');
  } finally {
    button.disabled = false;
  }
});

document.getElementById('cancelProductEdit').addEventListener('click', resetProductForm);
document.getElementById('refreshInventory').addEventListener('click', async () => {
  try { await loadInventory(); showStatus('Inventaire actualisé.'); }
  catch (error) { showStatus(error.message || 'Impossible de charger les produits.', 'error'); }
});

inventoryList.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit-product]');
  const toggleButton = event.target.closest('[data-toggle-product]');
  const product = products.find((item) => item.id === (editButton || toggleButton)?.dataset.editProduct
    || item.id === toggleButton?.dataset.toggleProduct);
  if (!product) return;
  if (editButton) {
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productImage').value = product.image_url;
    document.getElementById('productSizes').value = (product.sizes || []).join(', ');
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productActive').checked = product.active;
    document.getElementById('productFormTitle').textContent = 'Modifier le produit';
    document.getElementById('cancelProductEdit').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (toggleButton) {
    toggleButton.disabled = true;
    try {
      const { error } = await client.from('products')
        .update({ active: !product.active, updated_at: new Date().toISOString() })
        .eq('id', product.id);
      if (error) throw error;
      await loadInventory();
      showStatus(product.active ? 'Produit masqué de la boutique.' : 'Produit publié dans la boutique.');
    } catch (error) {
      showStatus(error.message || 'Impossible de modifier la publication du produit.', 'error');
    } finally { toggleButton.disabled = false; }
  }
});

['orderSearch', 'paymentFilter', 'deliveryFilter'].forEach((id) => {
  document.getElementById(id).addEventListener('input', renderOrders);
  document.getElementById(id).addEventListener('change', renderOrders);
});

document.getElementById('refreshOrders').addEventListener('click', async () => {
  const button = document.getElementById('refreshOrders');
  button.disabled = true;
  try { await loadOrders(); showStatus('Commandes actualisées.'); }
  catch (error) { showStatus(error.message || 'Impossible de charger les commandes.', 'error'); }
  finally { button.disabled = false; }
});

document.getElementById('exportOrders').addEventListener('click', () => {
  if (!ordersLoaded) { showStatus('Charge les commandes avant de les exporter.', 'error'); return; }
  if (!orders.length) { showStatus('Aucune commande à exporter.', 'error'); return; }
  exportOrdersCsv();
});

document.getElementById('ordersList').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-save-order]');
  if (!button) return;
  const card = button.closest('[data-order-id]');
  button.disabled = true;
  try {
    const { error } = await client.from('orders').update({
      payment_status: card.querySelector('[data-field="payment_status"]').value,
      delivery_status: card.querySelector('[data-field="delivery_status"]').value,
      transaction_reference: card.querySelector('[data-field="transaction_reference"]').value.trim()
    }).eq('id', card.dataset.orderId);
    if (error) throw error;
    await loadOrders();
    showStatus(`Suivi de la commande ${card.querySelector('.order-reference').textContent} enregistré.`);
  } catch (error) {
    showStatus(error.message || 'Impossible d’enregistrer le suivi de la commande.', 'error');
  } finally { button.disabled = false; }
});

async function initializeAdmin() {
  if (!client) {
    showStatus('Supabase n’est pas configuré. Renseigne supabase-config.js avec l’URL du projet et la clé publishable.', 'error');
    return;
  }
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await verifyAdmin(data.session.user);
    else showStatus('Tu es déconnecté.');
  } catch (error) {
    setAuthenticated(null);
    showStatus(error.message || 'Impossible de charger la session administrateur.', 'error');
  }
}

initializeAdmin();
