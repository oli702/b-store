// ======================================================
// B-STORE
// Gestion du menu, filtres, panier global, modal panier,
// fiche produit, formulaire commande
// ======================================================

const formatPrice = (n) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA';
const SHIPPING_FEE = 2000;
const IPHONE_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);
const TECH_REQUEST_IMAGES = {
  computer: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1000&auto=format&fit=crop',
  playstation: 'assets/playstation-console.svg'
};

function createIPhoneProduct(id, name, price, storage = null) {
  return {
    id,
    name,
    price,
    oldPrice: null,
    cat: 'Téléphones',
    category: 'telephones',
    optionLabel: 'Capacité de stockage',
    img: IPHONE_IMAGE,
    gallery: [IPHONE_IMAGE],
    desc: `${name}${storage ? ` avec ${storage} de stockage` : ''}. Visuel illustratif ; capacité, coloris, état et disponibilité à confirmer auprès de B-STORE.`,
    sizes: storage ? [storage] : [],
    features: [
      `Prix communiqué : ${formatPrice(price)}`,
      storage ? `Stockage : ${storage}` : 'Capacité de stockage à confirmer',
      'Coloris, état et disponibilité à confirmer avant commande'
    ]
  };
}

// Add each available shoe color to its colors list with a name, swatch, and image.
const CATALOG = {
  p1: {
    id: 'p1',
    name: 'Sneakers adidas JP5507',
    price: 18000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'https://assets.adidas.com/images/w_1880,f_auto,q_auto/be661c788b5a4ddbb9963b01f59c7c81_9366/JP5507_09_standard.jpg',
    gallery: [
      'https://assets.adidas.com/images/w_1880,f_auto,q_auto/be661c788b5a4ddbb9963b01f59c7c81_9366/JP5507_09_standard.jpg'
    ],
    desc: 'Sneakers adidas modèle JP5507. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Coloris présenté', hex: '#d8d1c3', img: 'https://assets.adidas.com/images/w_1880,f_auto,q_auto/be661c788b5a4ddbb9963b01f59c7c81_9366/JP5507_09_standard.jpg' }
    ],
    features: ['Prix unitaire : 18 000 FCFA', 'Pointures 39 à 44', 'Coloris présenté sur la photo']
  },
  p2: {
    id: 'p2',
    name: 'Maillots de clubs',
    price: 5000,
    oldPrice: null,
    cat: 'Maillots',
    category: 'maillots',
    optionLabel: 'Taille',
    img: 'assets/club-jersey-reference.webp',
    gallery: ['assets/club-jersey-reference.webp'],
    desc: 'Maillots de la saison actuelle pour les grands clubs. Choisissez votre équipe, le modèle simple ou pro, puis votre taille.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    features: ['Modèle simple : 5 000 FCFA', 'Modèle pro : 10 000 FCFA', 'Équipe et disponibilité à confirmer']
  },
  p3: {
    id: 'p3',
    name: 'iPhone 14 Pro 256 Go',
    price: 285000,
    oldPrice: null,
    cat: 'Téléphones',
    category: 'telephones',
    optionLabel: 'Capacité de stockage',
    img: IPHONE_IMAGE,
    gallery: [IPHONE_IMAGE],
    desc: 'iPhone 14 Pro avec 256 Go de stockage. Visuel illustratif ; coloris, état et disponibilité à confirmer auprès de B-STORE.',
    sizes: ['256 Go'],
    features: ['Prix communiqué : 285 000 FCFA', 'Stockage : 256 Go', 'Coloris, état et disponibilité à confirmer avant commande']
  },
  p4: {
    id: 'p4',
    name: 'Sneakers streetwear',
    price: 18000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'https://tse3.mm.bing.net/th/id/OIP.Or8mAaPGVeia2iVMZ4cLLgAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    gallery: [
      'https://tse3.mm.bing.net/th/id/OIP.Or8mAaPGVeia2iVMZ4cLLgAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
    ],
    desc: 'Sneakers streetwear sélectionnées par B-STORE. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: [
      { name: 'Coloris présenté', hex: '#d7d4cf', img: 'https://tse3.mm.bing.net/th/id/OIP.Or8mAaPGVeia2iVMZ4cLLgAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' }
    ],
    features: ['Prix unitaire : 18 000 FCFA', 'Pointures 38 à 43', 'Coloris présenté sur la photo']
  },
  p6: {
    id: 'p6',
    name: 'Ordinateurs & PlayStation',
    price: null,
    oldPrice: null,
    cat: 'Ordinateurs & PlayStation',
    category: 'electronique',
    img: TECH_REQUEST_IMAGES.computer,
    gallery: [TECH_REQUEST_IMAGES.computer],
    desc: 'Choisissez un ordinateur ou une PlayStation, puis envoyez directement votre demande à B-STORE sur WhatsApp.',
    features: ['Ordinateurs : HP, Acer, Asus, Lenovo et Dell', 'Consoles : PlayStation 3, 4 et 5', 'Prix et disponibilité confirmés sur WhatsApp']
  },
  p7: {
    id: 'p7',
    name: 'Air Jordan 1 Low Panda',
    price: 18000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'https://sneakernews.com/wp-content/uploads/2022/12/air-jordan-1-low-panda-DC0774-101-5.jpg?w=1140',
    gallery: [
      'https://sneakernews.com/wp-content/uploads/2022/12/air-jordan-1-low-panda-DC0774-101-5.jpg?w=1140'
    ],
    desc: 'Air Jordan 1 Low Panda, coloris noir et blanc. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Noir / blanc', hex: '#292929', img: 'https://sneakernews.com/wp-content/uploads/2022/12/air-jordan-1-low-panda-DC0774-101-5.jpg?w=1140' }
    ],
    features: ['Prix unitaire : 18 000 FCFA', 'Pointures 39 à 44', 'Coloris présenté sur la photo']
  },
  p8: {
    id: 'p8',
    name: 'Sneakers Nike noir, blanc et rouge',
    price: 18000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'https://www.nike.ae/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dw23ce58ab/nk/85d/c/9/6/b/6/85dc96b6_1cef_43ec_8cef_40e3938ac7cf.jpg',
    gallery: [
      'https://www.nike.ae/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dw23ce58ab/nk/85d/c/9/6/b/6/85dc96b6_1cef_43ec_8cef_40e3938ac7cf.jpg'
    ],
    desc: 'Sneakers Nike dans un coloris noir, blanc et rouge. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Noir / blanc / rouge', hex: '#292929', img: 'https://www.nike.ae/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dw23ce58ab/nk/85d/c/9/6/b/6/85dc96b6_1cef_43ec_8cef_40e3938ac7cf.jpg' }
    ],
    features: ['Prix unitaire : 18 000 FCFA', 'Pointures 39 à 44', 'Coloris présenté sur la photo']
  },
  p9: {
    id: 'p9',
    name: 'Nike Air Max Plus (TN)',
    price: 20000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'https://tse4.mm.bing.net/th/id/OIP.UFTE8fWgxspecNigUMKzwgHaEo?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    gallery: [
      'https://tse4.mm.bing.net/th/id/OIP.UFTE8fWgxspecNigUMKzwgHaEo?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
    ],
    desc: 'Nike Air Max Plus (TN), disponible dans deux coloris. Choisissez le coloris et la pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      {
        name: 'Autre coloris',
        hex: '#aeb5bd',
        img: 'https://tse4.mm.bing.net/th/id/OIP.UFTE8fWgxspecNigUMKzwgHaEo?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
      },
      {
        name: 'Noir A-COLD-WALL*',
        hex: '#252525',
        img: 'https://cms-cdn.thesolesupplier.co.uk/2023/05/a-cold-wall-x-nike-tn-air-max-plus-black-fd7855-001.jpeg'
      }
    ],
    features: ['Prix unitaire : 20 000 FCFA', 'Pointures 39 à 44', 'Deux coloris au choix']
  },
  p10: {
    id: 'p10',
    name: 'Sneakers à semelle ajourée',
    price: 25000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'assets/sneakers-model-10-color-1.png',
    gallery: [
      'assets/sneakers-model-10-color-1.png',
      'assets/sneakers-model-10-color-2.jpg'
    ],
    desc: 'Sneakers à semelle ajourée proposées en noir et en blanc. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Noir', hex: '#252525', img: 'assets/sneakers-model-10-color-1.png' },
      { name: 'Blanc', hex: '#f4f4f1', img: 'assets/sneakers-model-10-color-2.jpg' }
    ],
    features: ['Prix unitaire : 25 000 FCFA', 'Pointures 39 à 44', 'Deux coloris au choix']
  },
  p11: {
    id: 'p11',
    name: 'New Balance 530',
    price: 17000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'assets/sneakers-model-11-color-1.jpg',
    gallery: [
      'assets/sneakers-model-11-color-1.jpg',
      'assets/sneakers-model-11-color-2.jpg'
    ],
    desc: 'New Balance 530 proposée en blanc et en rose poudré. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Blanc / gris', hex: '#e8e8e4', img: 'assets/sneakers-model-11-color-1.jpg' },
      { name: 'Rose poudré', hex: '#e8cdd0', img: 'assets/sneakers-model-11-color-2.jpg' }
    ],
    features: ['Prix unitaire : 17 000 FCFA', 'Pointures 39 à 44', 'Deux coloris au choix']
  },
  p12: {
    id: 'p12',
    name: 'New Balance 9060',
    price: 19000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'assets/sneakers-model-12-color-1.jpg',
    gallery: [
      'assets/sneakers-model-12-color-1.jpg',
      'assets/sneakers-model-12-color-2.jpg'
    ],
    desc: 'New Balance 9060 proposée en beige et en bleu marine. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Beige', hex: '#d8ccad', img: 'assets/sneakers-model-12-color-1.jpg' },
      { name: 'Bleu marine', hex: '#243a57', img: 'assets/sneakers-model-12-color-2.jpg' }
    ],
    features: ['Prix unitaire : 19 000 FCFA', 'Pointures 39 à 44', 'Deux coloris au choix']
  },
  p13: {
    id: 'p13',
    name: 'ASICS Gel-Kayano 14',
    price: 18000,
    oldPrice: null,
    cat: 'Chaussures',
    category: 'chaussures',
    optionLabel: 'Pointure',
    img: 'assets/asics-gel-kayano-14-color-1.jpg',
    gallery: [
      'assets/asics-gel-kayano-14-color-1.jpg',
      'assets/asics-gel-kayano-14-color-2.jpg'
    ],
    desc: 'ASICS Gel-Kayano 14 proposée en argent/noir et en rose. Choisissez votre coloris et votre pointure avant de l’ajouter au panier.',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Argent / noir', hex: '#777a7b', img: 'assets/asics-gel-kayano-14-color-1.jpg' },
      { name: 'Rose', hex: '#e5c4c9', img: 'assets/asics-gel-kayano-14-color-2.jpg' }
    ],
    features: ['Prix unitaire : 18 000 FCFA', 'Pointures 39 à 44', 'Deux coloris au choix']
  },
  p14: createIPhoneProduct('p14', 'iPhone 11', 125000),
  p15: createIPhoneProduct('p15', 'iPhone 12 128 Go', 140000, '128 Go'),
  p16: createIPhoneProduct('p16', 'iPhone 12 Pro 128 Go', 170000, '128 Go'),
  p17: createIPhoneProduct('p17', 'iPhone 12 Pro 256 Go', 190000, '256 Go'),
  p18: createIPhoneProduct('p18', 'iPhone 13 128 Go', 175000, '128 Go'),
  p19: createIPhoneProduct('p19', 'iPhone 13 256 Go', 195000, '256 Go'),
  p20: createIPhoneProduct('p20', 'iPhone 13 Pro 128 Go', 230000, '128 Go'),
  p21: createIPhoneProduct('p21', 'iPhone 13 Pro 256 Go', 245000, '256 Go'),
  p22: createIPhoneProduct('p22', 'iPhone 15 Pro 256 Go', 350000, '256 Go'),
  p23: createIPhoneProduct('p23', 'iPhone 16 128 Go', 350000, '128 Go'),
  p24: createIPhoneProduct('p24', 'iPhone 15 Pro Max', 390000),
  p25: createIPhoneProduct('p25', 'iPhone 14 Pro Max', 335000),
  p26: createIPhoneProduct('p26', 'iPhone 16 Pro 256 Go', 445000, '256 Go'),
  p27: createIPhoneProduct('p27', 'iPhone 16 Pro Max', 485000),
  p28: createIPhoneProduct('p28', 'iPhone 18 Pro Max', 1150000)
};

function mapManagedProduct(row) {
  const categoryLabels = {
    chaussures: 'Chaussures',
    maillots: 'Maillots',
    telephones: 'Téléphones',
    electronique: 'Ordinateurs & PlayStation'
  };
  const imageUrl = new URL(row.image_url, window.location.href);
  if (!['http:', 'https:'].includes(imageUrl.protocol)) {
    throw new Error(`L’image du produit « ${row.name} » doit utiliser une adresse HTTP ou HTTPS.`);
  }

  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    oldPrice: null,
    cat: categoryLabels[row.category],
    category: row.category,
    optionLabel: row.category === 'chaussures' ? 'Pointure' : 'Taille',
    img: imageUrl.href,
    gallery: [imageUrl.href],
    desc: row.description || '',
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colors: [],
    features: ['Disponibilité à confirmer avant commande'],
    managed: true
  };
}

function renderManagedProductCard(product) {
  return `
    <article class="product-card managed-product-card" data-cat="${escapeHtml(product.category)}" data-id="${escapeHtml(product.id)}">
      <div class="product-card__img">
        <img src="${escapeHtml(product.img)}" alt="${escapeHtml(product.name)}" loading="lazy">
      </div>
      <div class="product-card__body">
        <span class="product-card__cat">${escapeHtml(product.cat)}</span>
        <h3><a href="produit.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        <div class="product-card__price"><strong>${formatPrice(product.price)}</strong></div>
        <div class="product-card__actions">
          <a href="produit.html?id=${encodeURIComponent(product.id)}" class="btn btn--primary btn--sm">Voir le produit</a>
        </div>
      </div>
    </article>
  `;
}

let managedCatalogLoadError = false;

async function loadManagedProducts() {
  const config = window.BSTORE_SUPABASE_CONFIG;
  const supabase = window.supabase;
  if (!config?.url && !config?.anonKey) return;

  try {
    if (!config?.url || !config?.anonKey) {
      throw new Error('La configuration Supabase est incomplète.');
    }
    if (!supabase?.createClient) {
      throw new Error('La bibliothèque Supabase n’a pas pu être chargée.');
    }

    const client = supabase.createClient(config.url, config.anonKey);
    const { data, error } = await client
      .from('products')
      .select('id, name, category, price, image_url, description, sizes')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const grid = document.getElementById('productsGrid');
    data.forEach((row) => {
      const product = mapManagedProduct(row);
      CATALOG[product.id] = product;
      if (grid) grid.insertAdjacentHTML('beforeend', renderManagedProductCard(product));
    });
  } catch (error) {
    managedCatalogLoadError = true;
    console.error('Impossible de charger le catalogue Supabase :', error);
    const status = document.getElementById('managedCatalogStatus');
    if (status) {
      status.textContent = 'Certains produits n’ont pas pu être chargés. Réessaie dans quelques instants.';
      status.hidden = false;
    }
  }
}

const Cart = {
  key: 'b-store_cart',

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  },

  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    this.updateUI();
  },

  add(product, qty = 1, size = null, color = null, sizeLabel = 'Taille') {
    const items = this.load();
    const key = [product.id, size, color].filter(Boolean).join('__');
    const existing = items.find((item) => item.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        key,
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        img: product.img,
        size: size || null,
        sizeLabel: size ? sizeLabel : null,
        color: color || null,
        qty
      });
    }

    this.save(items);
    showToast(`${product.name} ajouté au panier ✅`);
    return true;
  },

  remove(key) {
    const items = this.load().filter((item) => item.key !== key);
    this.save(items);
  },

  updateQty(key, delta) {
    const items = this.load();
    const item = items.find((entry) => entry.key === key);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      this.save(items.filter((entry) => entry.key !== key));
    } else {
      this.save(items);
    }
  },

  clear() {
    this.save([]);
  },

  count() {
    return this.load().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  },

  subtotal() {
    return this.load().reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  },

  total() {
    return this.subtotal() + (this.count() > 0 ? SHIPPING_FEE : 0);
  },

  updateUI() {
    document.querySelectorAll('#cartCount').forEach((el) => {
      el.textContent = String(this.count());
    });

    renderCartBody();
    renderCartFooter();
    renderCheckout();
  }
};

function renderCartOptions(item) {
  const options = [
    item.color ? `Coloris : ${item.color}` : '',
    item.size ? `${item.sizeLabel || 'Taille'} : ${item.size}` : ''
  ].filter(Boolean);

  return options.map((option) => `
    <div style="font-size:11px;color:#888;margin-bottom:2px;">${escapeHtml(option)}</div>
  `).join('');
}

function renderCartBody() {
  const body = document.getElementById('cartBody');
  if (!body) return;

  const items = Cart.load();

  if (items.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon">🛒</div>
        <p>Votre panier est vide</p>
        <a href="index.html#produits" class="btn btn--primary btn--sm">Découvrir la boutique</a>
      </div>
    `;
    return;
  }

  body.innerHTML = items.map((item) => `
    <div class="cart-item" data-key="${escapeHtml(item.key)}">
      <img class="cart-item__img" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}">
      <div class="cart-item__info">
        <h4>${escapeHtml(item.name)}</h4>
        ${renderCartOptions(item)}
        <div class="cart-item__price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item__controls">
        <div class="qty-controls">
          <button class="qty-btn" data-action="minus" data-key="${escapeHtml(item.key)}" type="button">−</button>
          <span class="qty-value">${Number(item.qty) || 0}</span>
          <button class="qty-btn" data-action="plus" data-key="${escapeHtml(item.key)}" type="button">+</button>
        </div>
        <button class="cart-item__remove" data-action="remove" data-key="${escapeHtml(item.key)}" type="button">Retirer</button>
      </div>
    </div>
  `).join('');
}

function renderCartFooter() {
  const footer = document.getElementById('cartFooter');
  if (!footer) return;

  const hasItems = Cart.count() > 0;
  footer.hidden = !hasItems;

  if (!hasItems) return;

  document.getElementById('cartSubtotal').textContent = formatPrice(Cart.subtotal());
  document.getElementById('cartShipping').textContent = formatPrice(SHIPPING_FEE);
  document.getElementById('cartTotal').textContent = formatPrice(Cart.total());
}

function renderCheckout() {
  const container = document.getElementById('checkoutItems');
  if (!container) return;

  const items = Cart.load();

  if (items.length === 0) {
    container.innerHTML = '<p style="color:#888;text-align:center;padding:20px 0;">Votre panier est vide.</p>';
    const subtotalEl = document.getElementById('sumSubtotal');
    const shippingEl = document.getElementById('sumShipping');
    const totalEl = document.getElementById('sumTotal');
    if (subtotalEl) subtotalEl.textContent = '0 FCFA';
    if (shippingEl) shippingEl.textContent = '0 FCFA';
    if (totalEl) totalEl.textContent = '0 FCFA';
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="cart-item">
      <img class="cart-item__img" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}">
      <div class="cart-item__info">
        <h4>${escapeHtml(item.name)}</h4>
        ${renderCartOptions(item)}
        <div class="cart-item__controls">
          <div class="cart-item__price">${item.qty} × ${formatPrice(item.price)}</div>
        </div>
      </div>
    </div>
  `).join('');

  const subtotalEl = document.getElementById('sumSubtotal');
  const shippingEl = document.getElementById('sumShipping');
  const totalEl = document.getElementById('sumTotal');

  if (subtotalEl) subtotalEl.textContent = formatPrice(Cart.subtotal());
  if (shippingEl) shippingEl.textContent = formatPrice(SHIPPING_FEE);
  if (totalEl) totalEl.textContent = formatPrice(Cart.total());
}

function setupCartModal() {
  const modal = document.getElementById('cartModal');
  const openBtns = document.querySelectorAll('#openCart');

  if (!modal) return;

  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  document.querySelectorAll('[data-close-cart]').forEach((element) => {
    element.addEventListener('click', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  modal.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const key = button.dataset.key;
    const action = button.dataset.action;

    if (action === 'plus') Cart.updateQty(key, +1);
    if (action === 'minus') Cart.updateQty(key, -1);
    if (action === 'remove') Cart.remove(key);
  });
}

function setupAddToCart() {
  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const card = button.closest('.product-card');
      if (!card) return;

      const product = {
        id: card.dataset.id,
        name: card.dataset.name,
        price: Number(card.dataset.price) || 0,
        img: card.dataset.img
      };

      Cart.add(product, 1);
    });
  });
}

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function setupMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach((button) => {
    button.addEventListener('click', () => {
      filterBtns.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      const filter = button.dataset.filter;
      document.querySelectorAll('.product-card').forEach((product) => {
        product.classList.toggle('hidden', filter !== 'all' && product.dataset.cat !== filter);
      });
    });
  });

  document.querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', () => {
      const category = card.dataset.cat;
      const target = [...filterBtns].find((button) => button.dataset.filter === category);
      if (target) target.click();
    });
  });
}

function setupProductPage() {
  const container = document.getElementById('productDetail');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'p1';
  const isPhoneCatalog = id === 'iphone-catalog';
  const isTechRequest = id === 'p6';
  const isJerseyCatalog = id === 'p2';
  const isManagedId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const product = CATALOG[id] || (isPhoneCatalog ? CATALOG.p14 : isManagedId ? null : CATALOG.p1);
  if (!product) {
    const message = managedCatalogLoadError
      ? 'Impossible de charger ce produit pour le moment. Réessaie dans quelques instants.'
      : 'Ce produit est introuvable ou n’est plus publié dans la boutique.';
    container.innerHTML = `<p class="catalog-status" role="alert">${message}</p>`;
    return;
  }
  const phoneDisplayOrder = ['p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20', 'p21', 'p3', 'p25', 'p22', 'p24', 'p23', 'p26', 'p27', 'p28'];
  const jerseyTeams = ['Paris Saint-Germain (PSG)', 'FC Barcelone', 'Bayern Munich', 'Manchester United', 'Manchester City', 'Chelsea', 'Atlético Madrid'];
  let selectedJerseyTeam = jerseyTeams[0];
  let selectedJerseyType = 'Simple';
  let selectedJerseyPrice = 5000;
  let selectedPhone = product;
  const productSizes = product.sizes || [];
  const productColors = product.colors || [];
  let selectedSize = productSizes[0] || null;
  let selectedColor = productColors[0] || null;

  const crumb = document.getElementById('crumbName');
  if (crumb) crumb.textContent = isPhoneCatalog ? 'Téléphones iPhone' : product.name;

  container.innerHTML = `
    <div class="product-gallery">
      <div class="product-gallery__main">
        <img id="mainImg" src="${escapeHtml(product.gallery[0])}" alt="${isTechRequest ? 'Ordinateur portable' : isPhoneCatalog ? 'Visuel indicatif d’un téléphone iPhone' : escapeHtml(product.name)}">
      </div>
      <div class="product-gallery__thumbs">
        ${product.gallery.map((src, index) => `
          <img src="${escapeHtml(src)}" alt="Vue ${index + 1}" class="${index === 0 ? 'active' : ''}" data-src="${escapeHtml(src)}">
        `).join('')}
      </div>
    </div>

    <div class="product-info">
      <span style="color:var(--primary); font-weight:600; font-size:13px; text-transform:uppercase;">${escapeHtml(product.cat)}</span>
      <h1>${isPhoneCatalog ? 'Téléphones iPhone' : isJerseyCatalog ? 'Maillots des grands clubs' : escapeHtml(product.name)}</h1>
      <p class="product-info__availability"><span></span> ${isTechRequest ? 'Demande de prix et disponibilité' : isPhoneCatalog || isJerseyCatalog || product.managed ? 'Disponibilité à confirmer' : 'Disponible à la commande'}</p>
      ${isTechRequest ? '' : `
        <div class="product-info__price">
          <strong id="detailPrice">${formatPrice(product.price)}</strong>
          ${product.oldPrice ? `<s>${formatPrice(product.oldPrice)}</s>` : ''}
        </div>
      `}
      <p class="product-info__desc">${isTechRequest
        ? 'Sélectionnez une catégorie et un modèle. Votre demande sera envoyée directement à B-STORE sur WhatsApp.'
        : isJerseyCatalog
        ? 'Maillots de la saison actuelle. Choisissez une équipe, la version simple ou pro et votre taille ; le prix s’actualise automatiquement.'
        : isPhoneCatalog
        ? 'Choisissez le modèle et la capacité dans la liste. Le prix affiché se met à jour automatiquement. La photo est un visuel indicatif.'
        : escapeHtml(product.desc)}</p>

      ${isJerseyCatalog ? `
        <div class="product-info__options">
          <label class="option-label" for="jerseyTeamSelect">Équipe :</label>
          <select class="product-select" id="jerseyTeamSelect">
            ${jerseyTeams.map((team, index) => `<option value="${team}" ${index === 0 ? 'selected' : ''}>${team}</option>`).join('')}
          </select>
        </div>
        <div class="product-info__options">
          <label class="option-label" for="jerseyTypeSelect">Modèle :</label>
          <select class="product-select" id="jerseyTypeSelect">
            <option value="Simple" selected>Simple — 5 000 FCFA</option>
            <option value="Pro">Pro — 10 000 FCFA</option>
          </select>
        </div>
      ` : ''}

      ${isTechRequest ? `
        <div class="product-info__options">
          <label class="option-label" for="techCategory">Que recherchez-vous ?</label>
          <select class="product-select" id="techCategory" required>
            <option value="">Choisir une catégorie</option>
            <option value="computer">Ordinateur</option>
            <option value="playstation">PlayStation</option>
          </select>
        </div>
        <div class="product-info__options">
          <label class="option-label" for="techModel">Marque ou console</label>
          <select class="product-select" id="techModel" disabled required>
            <option value="">Choisissez d’abord une catégorie</option>
          </select>
        </div>
        <div class="product-info__options">
          <label class="option-label" for="techDetails">Modèle ou détails souhaités (facultatif)</label>
          <input class="product-select" id="techDetails" type="text" maxlength="160" placeholder="Ex. Pavilion, 8 Go RAM, SSD 512 Go">
        </div>
      ` : ''}

      ${isPhoneCatalog ? `
        <div class="product-info__options">
          <label class="option-label" for="phoneModelSelect">Modèle et capacité :</label>
          <select class="product-select" id="phoneModelSelect">
            ${phoneDisplayOrder
              .map((phoneId) => CATALOG[phoneId])
              .filter(Boolean)
              .map((item) => `<option value="${item.id}" ${item.id === selectedPhone.id ? 'selected' : ''}>${item.name} — ${formatPrice(item.price)}</option>`)
              .join('')}
          </select>
        </div>
      ` : ''}

      ${productColors.length ? `
        <div class="product-info__options">
          <span class="option-label">Coloris : <span class="selected-color-name">${selectedColor.name}</span></span>
          <div class="color-options" id="colorOptions">
            ${productColors.map((color, index) => `
              <button class="color-btn ${index === 0 ? 'active' : ''}" type="button" data-color="${color.name}" aria-pressed="${index === 0}" aria-label="Choisir le coloris ${color.name}">
                <span class="color-swatch" style="--swatch-color:${color.hex}" aria-hidden="true"></span>
                <span>${color.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${productSizes.length ? `
        <div class="product-info__options">
          <span class="option-label">${product.optionLabel || (product.category === 'chaussures' ? 'Pointure' : 'Taille')} :</span>
          <div class="size-options" id="sizeOptions">
            ${productSizes.map((size, index) => `
              <button class="size-btn ${index === 0 ? 'active' : ''}" type="button" data-size="${escapeHtml(size)}" aria-pressed="${index === 0}">${escapeHtml(size)}</button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${isTechRequest ? `
        <div class="product-info__actions">
          <button id="sendTechRequest" class="btn btn--primary" type="button">Continuer sur WhatsApp</button>
        </div>
      ` : `
        <div class="product-info__actions">
          <div class="qty-big">
            <button id="pQtyMinus" type="button">−</button>
            <span id="pQty">1</span>
            <button id="pQtyPlus" type="button">+</button>
          </div>
          <button id="addToCartDetail" class="btn btn--primary" type="button">Ajouter au panier</button>
        </div>
      `}

      <ul class="product-features" id="productFeatures">
        ${product.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}
      </ul>
    </div>
  `;

  const mainImg = document.getElementById('mainImg');
  if (isJerseyCatalog) {
    const teamSelect = document.getElementById('jerseyTeamSelect');
    const typeSelect = document.getElementById('jerseyTypeSelect');
    const priceElement = document.getElementById('detailPrice');
    const featuresElement = document.getElementById('productFeatures');
    const updateJersey = () => {
      selectedJerseyTeam = teamSelect?.value || jerseyTeams[0];
      selectedJerseyType = typeSelect?.value || 'Simple';
      selectedJerseyPrice = selectedJerseyType === 'Pro' ? 10000 : 5000;
      if (priceElement) priceElement.textContent = formatPrice(selectedJerseyPrice);
      if (featuresElement) {
        featuresElement.innerHTML = [
          `Maillot ${selectedJerseyType.toLowerCase()} : ${formatPrice(selectedJerseyPrice)}`,
          `Équipe : ${selectedJerseyTeam}`,
          'Saison actuelle — disponibilité à confirmer'
        ].map((feature) => `<li>${feature}</li>`).join('');
      }
    };
    teamSelect?.addEventListener('change', updateJersey);
    typeSelect?.addEventListener('change', updateJersey);
    updateJersey();
  }

  if (isTechRequest) {
    const categorySelect = document.getElementById('techCategory');
    const modelSelect = document.getElementById('techModel');
    const detailsInput = document.getElementById('techDetails');
    categorySelect?.addEventListener('change', () => {
      const isComputer = categorySelect.value === 'computer';
      const options = isComputer
        ? ['HP', 'Acer', 'Asus', 'Lenovo', 'Dell']
        : categorySelect.value === 'playstation' ? ['PlayStation 3', 'PlayStation 4', 'PlayStation 5'] : [];
      if (modelSelect) {
        modelSelect.innerHTML = `<option value="">Choisir un modèle</option>${options.map((option) => `<option value="${option}">${option}</option>`).join('')}`;
        modelSelect.disabled = options.length === 0;
      }
      if (mainImg && categorySelect.value) {
        mainImg.src = TECH_REQUEST_IMAGES[categorySelect.value];
        mainImg.alt = isComputer ? 'Ordinateur portable' : 'Console de jeu';
      }
    });

    document.getElementById('sendTechRequest')?.addEventListener('click', () => {
      if (!categorySelect?.value || !modelSelect?.value) {
        categorySelect?.reportValidity();
        modelSelect?.reportValidity();
        return;
      }
      const details = detailsInput?.value.trim();
      const message = [
        'Bonjour B-STORE, je souhaite me renseigner sur un article.',
        `Catégorie : ${categorySelect.value === 'computer' ? 'Ordinateur' : 'PlayStation'}`,
        `Marque / console : ${modelSelect.value}`,
        details ? `Modèle ou détails souhaités : ${details}` : ''
      ].filter(Boolean).join('\n');
      window.location.href = `https://wa.me/22670895871?text=${encodeURIComponent(message)}`;
    });
  }

  if (isPhoneCatalog) {
    const modelSelect = document.getElementById('phoneModelSelect');
    const priceElement = document.getElementById('detailPrice');
    const featuresElement = document.getElementById('productFeatures');
    modelSelect?.addEventListener('change', () => {
      selectedPhone = CATALOG[modelSelect.value] || product;
      if (priceElement) priceElement.textContent = formatPrice(selectedPhone.price);
      if (featuresElement) {
        featuresElement.innerHTML = selectedPhone.features.map((feature) => `<li>${feature}</li>`).join('');
      }
    });
  }
  container.querySelectorAll('.product-gallery__thumbs img').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      if (mainImg) mainImg.src = thumb.dataset.src;
      container.querySelectorAll('.product-gallery__thumbs img').forEach((item) => item.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  container.querySelectorAll('.size-btn').forEach((button) => {
    button.addEventListener('click', () => {
      container.querySelectorAll('.size-btn').forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      selectedSize = button.dataset.size;
    });
  });

  container.querySelectorAll('.color-btn').forEach((button) => {
    button.addEventListener('click', () => {
      container.querySelectorAll('.color-btn').forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      selectedColor = productColors.find((color) => color.name === button.dataset.color) || null;

      const selectedName = container.querySelector('.selected-color-name');
      if (selectedName && selectedColor) selectedName.textContent = selectedColor.name;
      if (mainImg && selectedColor?.img) {
        mainImg.src = selectedColor.img;
        container.querySelectorAll('.product-gallery__thumbs img').forEach((thumb) => {
          thumb.classList.toggle('active', thumb.dataset.src === selectedColor.img);
        });
      }
    });
  });

  let qty = 1;
  const qtyEl = document.getElementById('pQty');
  const qtyMinus = document.getElementById('pQtyMinus');
  const qtyPlus = document.getElementById('pQtyPlus');

  qtyPlus?.addEventListener('click', () => {
    qty += 1;
    if (qtyEl) qtyEl.textContent = String(qty);
  });

  qtyMinus?.addEventListener('click', () => {
    if (qty > 1) {
      qty -= 1;
      if (qtyEl) qtyEl.textContent = String(qty);
    }
  });

  if (!isTechRequest) document.getElementById('addToCartDetail')?.addEventListener('click', () => {
    const cartProduct = isJerseyCatalog
      ? {
          id: product.id,
          name: `Maillot ${selectedJerseyType} — ${selectedJerseyTeam}`,
          price: selectedJerseyPrice,
          img: product.img
        }
      : {
          id: selectedPhone.id,
          name: selectedPhone.name,
          price: selectedPhone.price,
          img: selectedColor?.img || selectedPhone.img,
          stock: selectedPhone.stock
        };
    const added = Cart.add(
      cartProduct,
      qty,
      selectedSize,
      selectedColor?.name || null,
      product.optionLabel || (product.category === 'chaussures' ? 'Pointure' : 'Taille')
    );
    if (!added) return;
    const cartModal = document.getElementById('cartModal');
    cartModal?.classList.add('open');
    cartModal?.setAttribute('aria-hidden', 'false');
  });

  if (isPhoneCatalog || isTechRequest) {
    const relatedSection = document.getElementById('relatedProducts')?.closest('.section');
    if (relatedSection) relatedSection.hidden = true;
  } else {
    renderRelated(product);
  }
}

function renderRelated(current) {
  const container = document.getElementById('relatedProducts');
  if (!container) return;

  let related = Object.values(CATALOG)
    .filter((item) => item.id !== current.id && item.category === current.category)
    .slice(0, 3);

  if (related.length === 0) {
    related = Object.values(CATALOG)
      .filter((item) => item.id !== current.id)
      .slice(0, 3);
  }

  container.innerHTML = related.map((product) => `
    <article class="product-card" data-id="${escapeHtml(product.id)}" data-name="${escapeHtml(product.name)}" data-price="${product.price}" data-img="${escapeHtml(product.img)}" data-cat="${escapeHtml(product.category)}">
      <div class="product-card__img">
        <img src="${escapeHtml(product.img)}" alt="${escapeHtml(product.name)}">
      </div>
      <div class="product-card__body">
        <span class="product-card__cat">${escapeHtml(product.cat)}</span>
        <h3><a href="produit.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        <div class="product-card__price">
          <strong>${formatPrice(product.price)}</strong>
          ${product.oldPrice ? `<s>${formatPrice(product.oldPrice)}</s>` : ''}
        </div>
        <div class="product-card__actions">
          <a href="produit.html?id=${encodeURIComponent(product.id)}" class="btn btn--ghost btn--sm">Voir</a>
          <a href="produit.html?id=${encodeURIComponent(product.id)}" class="btn btn--primary btn--sm">Choisir les options</a>
        </div>
      </div>
    </article>
  `).join('');

  setupAddToCart();
}

function setupCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  if (Cart.count() === 0) {
    showToast('Votre panier est vide. Ajoutez des produits d\'abord.');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const items = Cart.load();
    if (items.length === 0) {
      showToast('Votre panier est vide ❌');
      return;
    }

    const data = {
      nom: document.getElementById('nom').value.trim(),
      tel: document.getElementById('tel').value.trim(),
      email: document.getElementById('email').value.trim(),
      adresse: document.getElementById('adresse').value.trim(),
      ville: document.getElementById('ville').value.trim(),
      pays: document.getElementById('pays').value.trim(),
      paiement: document.querySelector('input[name="paiement"]:checked')?.value || 'wave',
      notes: document.getElementById('notes').value.trim()
    };

    const paiementLabels = {
      wave: 'Wave',
      orange: 'Orange Money',
      mtn: 'MTN MoMo',
      cash: 'Paiement à la livraison'
    };

    let msg = '*🛒 NOUVELLE COMMANDE — B-STORE*\n\n';
    msg += '*👤 Client*\n';
    msg += `Nom : ${data.nom}\n`;
    msg += `Téléphone : ${data.tel}\n`;
    if (data.email) msg += `Email : ${data.email}\n`;
    msg += '\n*📍 Livraison*\n';
    msg += `${data.adresse}\n${data.ville}, ${data.pays}\n`;
    msg += '\n*🛍️ Produits*\n';

    items.forEach((item) => {
      const itemOptions = [
        item.color ? `Coloris : ${item.color}` : '',
        item.size ? `${item.sizeLabel || 'Taille'} : ${item.size}` : ''
      ].filter(Boolean);
      msg += `• ${item.name}${itemOptions.length ? ` (${itemOptions.join(', ')})` : ''} × ${item.qty} = ${formatPrice(item.price * item.qty)}\n`;
    });

    msg += '\n*💰 Récapitulatif*\n';
    msg += `Sous-total : ${formatPrice(Cart.subtotal())}\n`;
    msg += `Livraison : ${formatPrice(SHIPPING_FEE)}\n`;
    msg += `*TOTAL : ${formatPrice(Cart.total())}*\n`;
    msg += `\n*💳 Paiement* : ${paiementLabels[data.paiement] || 'Wave'}\n`;
    if (data.notes) msg += `\n*📝 Notes*\n${data.notes}\n`;
    msg += '\nMerci de confirmer ma commande 🙏';

    const WHATSAPP_NUMBER = '22670895871';
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast('Commande envoyée sur WhatsApp ✅');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadManagedProducts().finally(() => {
    setupMobileMenu();
    setupFilters();
    setupAddToCart();
    setupCartModal();
    setupProductPage();
    setupCheckoutForm();
    Cart.updateUI();
  });
});

window.addEventListener('storage', (event) => {
  if (event.key === 'b-store_cart') {
    Cart.updateUI();
  }
});
