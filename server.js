require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token === 'admin-token-secreto-123') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado' });
    }
};

// --- FUNÇÃO PARA CRIAR SLUG (URL AMIGÁVEL) ---
function createSlug(title) {
    return title
        .toString()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, '-')     // Substitui espaços por hifens
        .replace(/[^\w\-]+/g, '') // Remove caracteres especiais
        .replace(/\-\-+/g, '-')   // Remove hifens duplicados
        .replace(/^-+/, '')       // Remove hifens do começo
        .replace(/-+$/, '');      // Remove hifens do fim
}

// ================= ROTAS =================

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (user.password.trim() === password.trim()) {
                return res.json({ token: 'admin-token-secreto-123', success: true });
            }
        }
        res.status(401).json({ success: false, message: "Credenciais inválidas" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/blog', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
        res.render('blog', { 
            posts: result.rows,
            pageTitle: 'Blog Jurídico | Silva Neves Advogados',
            pageDesc: 'Artigos e notícias sobre direito trabalhista, cível e previdenciário em Formiga-MG.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao carregar o blog");
    }
});

// --- ROTA DE SEO ALTERADA: BUSCA PELO SLUG ---
// Agora a rota espera /artigo/meu-titulo-legal
app.get('/artigo/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        // Busca pela coluna 'slug' em vez de 'id'
        const result = await pool.query("SELECT * FROM posts WHERE slug = $1", [slug]);
        
        if (result.rows.length === 0) {
            return res.status(404).render('404', { pageTitle: 'Não encontrado' }); // O ideal é ter uma view 404
        }

        const post = result.rows[0];

        res.render('artigo', { 
            post: post,
            pageTitle: `${post.title} | Silva Neves Advogados`,
            pageDesc: post.summary 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro interno ao carregar o artigo");
    }
});

// --- CRIAR POST (GERA SLUG AUTOMATICAMENTE) ---
app.post('/posts', authMiddleware, async (req, res) => {
    const { title, summary, content, image_url } = req.body;
    
    // Gera o slug a partir do título
    const slug = createSlug(title);

    try {
        await pool.query(
            `INSERT INTO posts (title, summary, content, image_url, slug) VALUES ($1, $2, $3, $4, $5)`, 
            [title, summary, content, image_url, slug]
        );
        res.json({ message: 'Post criado com sucesso!' });
    } catch (err) {
        console.error(err);
        // Erro comum: slug duplicado (títulos iguais)
        if (err.code === '23505') {
            return res.status(400).json({ error: "Já existe um artigo com este título exato." });
        }
        res.status(500).json({ error: "Erro ao salvar no banco" });
    }
});

// --- ATUALIZAR POST ---
app.put('/posts/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, summary, content, image_url } = req.body;
    
    // Atualiza o slug caso o título mude
    const slug = createSlug(title);

    try {
        await pool.query(
            `UPDATE posts SET title=$1, summary=$2, content=$3, image_url=$4, slug=$5 WHERE id=$6`,
            [title, summary, content, image_url, slug, id]
        );
        res.json({ message: 'Post atualizado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao atualizar" });
    }
});

app.delete('/posts/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM posts WHERE id = $1", [id]);
        res.json({ message: 'Post deletado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao deletar" });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
        res.json(result.rows); 
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar posts" });
    }
});

if (require.main === module) {
    app.listen(3000, () => {});
}

module.exports = app;