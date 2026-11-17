# Configuration de l’administration B-STORE

L’administration utilise Supabase. Les visiteurs peuvent lire uniquement les champs publics des produits actifs et les photos publiques. Le stock exact est réservé à l’administration : son inventaire est chargé par la fonction sécurisée `get_admin_products`. Les modifications de produits et de stock exigent un compte Supabase autorisé par `admin_users`. La clé `anonKey` est publique ; ne place jamais une clé `service_role` dans les fichiers du site.

## 1. Créer le projet Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) et conserve le mot de passe de base de données dans un gestionnaire privé.
2. Dans **SQL Editor**, exécute tout le contenu de `supabase-schema.sql`.
3. Dans **Authentication → Users**, crée l’utilisateur qui servira à l’administration. Utilise une adresse e-mail que tu contrôles et choisis toi-même son mot de passe.
4. Copie l’UUID de cet utilisateur. Dans le SQL Editor, exécute la commande suivante en remplaçant l’adresse entre apostrophes par la tienne :

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where lower(email) = lower('TON-EMAIL')
   on conflict (user_id) do nothing;
   ```

   Vérifie qu’une ligne a été créée dans `public.admin_users`. Ne partage jamais le mot de passe.

## 2. Configurer le site

Dans **Project Settings → API** (ou **API Keys**), copie le **Project URL** et la **publishable/anon key**. Dans `supabase-config.js`, renseigne-les ici :

```js
window.BSTORE_SUPABASE_CONFIG = {
  url: 'https://TON-PROJET.supabase.co',
  anonKey: 'TA_CLE_PUBLISHABLE_OU_ANON'
};
```

Cette clé est conçue pour être utilisée côté navigateur : les permissions sont protégées par les politiques RLS du script SQL. N’utilise jamais la clé `service_role` ou une clé secrète dans le site.

Publie les fichiers du projet, notamment `admin.html`, `admin.js`, `admin.css`, `supabase-config.js` et `supabase-schema.sql`, sur GitHub Pages. L’administration se trouve à `/admin.html`.

## 3. Utiliser l’administration

Connecte-toi à `/admin.html` avec le compte créé dans Supabase. Ajoute le nom, la catégorie, le prix, le stock, une photo et les options de taille. Les produits actifs apparaissent sur la boutique. Pour retirer temporairement un article, utilise **Masquer** ; sa fiche reste dans l’inventaire afin de pouvoir la republier.

La photo peut être téléversée depuis ton appareil (5 Mo maximum) ou fournie par URL. Le tableau de bord permet de modifier le prix, le stock, les tailles, la description et la publication sans modifier le code.
