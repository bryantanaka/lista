// Importando o Firebase diretamente do CDN do Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, doc, collection, onSnapshot, setDoc, updateDoc, addDoc, deleteDoc, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE
// Substitua pelas chaves que o Firebase te forneceu
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyC6UekGEGwWkxv5ENE5NlvDAfI0EY3nSHw",
    authDomain: "lista-4fd1d.firebaseapp.com",
    projectId: "lista-4fd1d",
    storageBucket: "lista-4fd1d.firebasestorage.app",
    messagingSenderId: "667570853489",
    appId: "1:667570853489:web:3a51ae8ccf1cfc49dfadd0",
    measurementId: "G-YGKB8ZZ9VS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referências do Banco
const listId = "minha_lista_01";
const listRef = doc(db, "listas", listId); // Documento de metadados
const itemsRef = collection(db, "listas", listId, "itens"); // Subcoleção de itens

// ==========================================
// 2. ESTADO E RENDERIZAÇÃO
// ==========================================
let listData = { title: null, subtitle: null, items: [] };

const headerSection = document.getElementById('header-section');
const itemsList = document.getElementById('items-list');
const addItemForm = document.getElementById('add-item-form');
const newItemInput = document.getElementById('new-item-input');

function renderHeader() {
    headerSection.innerHTML = '';

    if (listData.title !== null) {
        headerSection.innerHTML += `
            <div class="header-item">
                <input type="text" class="editable-title" value="${listData.title}" 
                       onblur="handleUpdateMeta('title', this.value)" placeholder="Digite o título...">
                <button class="btn-remove" onclick="handleRemoveMeta('title')" title="Remover título">✕</button>
            </div>`;
    } else {
        headerSection.innerHTML += `<button class="btn-add-meta" onclick="handleAddMeta('title')">+ Adicionar Título</button>`;
    }

    if (listData.subtitle !== null) {
        headerSection.innerHTML += `
            <div class="header-item">
                <input type="text" class="editable-subtitle" value="${listData.subtitle}" 
                       onblur="handleUpdateMeta('subtitle', this.value)" placeholder="Digite o subtítulo...">
                <button class="btn-remove" onclick="handleRemoveMeta('subtitle')" title="Remover subtítulo">✕</button>
            </div>`;
    } else {
        headerSection.innerHTML += `<button class="btn-add-meta" onclick="handleAddMeta('subtitle')">+ Adicionar Subtítulo</button>`;
    }
}

function renderItems() {
    itemsList.innerHTML = '';
    listData.items.forEach(item => {
        const li = document.createElement('li');
        if (item.completed) li.classList.add('completed');
        li.innerHTML = `
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="handleToggleStatus('${item.id}', ${item.completed})">
            <span>${item.text}</span>
            <button class="btn-remove-item" onclick="handleDeleteItem('${item.id}')" title="Remover item">✕</button>
        `;
        itemsList.appendChild(li);
    });
}

// ==========================================
// 3. LISTENERS EM TEMPO REAL (O "Mágico" do Firebase)
// ==========================================

// Escuta mudanças nos Títulos (Documento principal)
onSnapshot(listRef, (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        listData.title = data.title !== undefined ? data.title : null;
        listData.subtitle = data.subtitle !== undefined ? data.subtitle : null;
        renderHeader();
    } else {
        // Se a lista não existir no banco, cria com valores nulos para começar vazio
        setDoc(listRef, { title: null, subtitle: null });
    }
});

// Escuta mudanças nos Itens (Subcoleção), ordenado pela data de criação
const itemsQuery = query(itemsRef, orderBy("createdAt", "asc"));
onSnapshot(itemsQuery, (snapshot) => {
    listData.items = [];
    snapshot.forEach((doc) => {
        listData.items.push({ id: doc.id, ...doc.data() });
    });
    renderItems();
});

// ==========================================
// 4. AÇÕES DO USUÁRIO (Gravando no Banco)
// ==========================================

window.handleAddMeta = (field) => {
    // Apenas renderiza localmente primeiro, salva no banco quando perder o foco (onblur)
    listData[field] = ""; 
    renderHeader();
    document.querySelector(field === 'title' ? '.editable-title' : '.editable-subtitle').focus();
};

window.handleRemoveMeta = async (field) => {
    // Para remover, podemos atualizar o campo no banco para null (ou usar deleteField())
    await updateDoc(listRef, { [field]: null });
};

window.handleUpdateMeta = async (field, value) => {
    if (listData[field] === value) return; 
    await updateDoc(listRef, { [field]: value });
};

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = newItemInput.value.trim();
    if (!text) return;

    newItemInput.disabled = true;
    try {
        await addDoc(itemsRef, {
            text: text,
            completed: false,
            createdAt: serverTimestamp() // Pega a hora exata do servidor do Google
        });
        newItemInput.value = '';
    } catch (error) {
        console.error("Erro ao adicionar item:", error);
    } finally {
        newItemInput.disabled = false;
        newItemInput.focus();
    }
});

window.handleToggleStatus = async (id, currentStatus) => {
    const itemDoc = doc(db, "listas", listId, "itens", id);
    await updateDoc(itemDoc, { completed: !currentStatus });
};

window.handleDeleteItem = async (id) => {
    const itemDoc = doc(db, "listas", listId, "itens", id);
    await deleteDoc(itemDoc);
};