'use strict';


/* заглушка картинки в виде svg */
const PLACEHOLDER_IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140">' +
        '<rect width="200" height="140" fill="#eef1f4"/>' +
        '<rect x="60" y="45" width="80" height="60" rx="6" fill="#cbd2da"/>' +
        '<rect x="60" y="45" width="80" height="18" rx="6" fill="#9aa4b0"/>' +
        '<text x="100" y="128" font-family="Arial" font-size="12" fill="#69717c" text-anchor="middle">Нет изображения</text>' +
        '</svg>'
    );


/* состояние приложения */
const state = {
    items: [],
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'name-asc',
    editingId: null /* ID товара, который сейчас редактируется */
};


/* ссылки на элементы страницы */
const elements = {
    searchInput:       document.getElementById('search-input'),
    categoryFilter:    document.getElementById('category-filter'),
    sortSelect:        document.getElementById('sort-select'),

    productsContainer: document.getElementById('products-container'),
    emptyMessage:      document.getElementById('empty-message'),
    resultsInfo:       document.getElementById('results-info'),

    openModalBtn:      document.getElementById('open-modal-btn'),

    modal:             document.getElementById('modal'),
    modalTitle:        document.getElementById('modal-title'),
    modalSubmitBtn:    document.getElementById('modal-submit-btn'),
    productForm:       document.getElementById('product-form')
};


/* форматирование цены */
function formatPrice(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
}


/* получить картинку или заглушку */
function getImageSrc(imageUrl) {
    if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        return imageUrl.trim();
    }
    return PLACEHOLDER_IMAGE;
}


/* фильтрация и сортировка */
function getVisibleItems() {
    let result = state.items.slice();

    if (state.searchQuery !== '') {
        const query = state.searchQuery.toLowerCase();

        result = result.filter(function (item) {
            const nameMatch = item.name.toLowerCase().includes(query);
            const descriptionMatch = (item.description || '').toLowerCase().includes(query);
            return nameMatch || descriptionMatch;
        });
    }

    if (state.selectedCategory !== 'all') {
        result = result.filter(function (item) {
            return item.category === state.selectedCategory;
        });
    }

    result.sort(function (a, b) {
        switch (state.sortBy) {
            case 'name-asc':
                return a.name.localeCompare(b.name, 'ru');
            case 'name-desc':
                return b.name.localeCompare(a.name, 'ru');
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
                return b.price - a.price;
            default:
                return 0;
        }
    });

    return result;
}


/* создание карточки товара */
function createProductCard(item) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.id = String(item.id);

    if (item.quantity === 0) {
        card.classList.add('product-card--empty');
    }

    /* блок с картинкой */
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'product-image';

    const img = document.createElement('img');
    img.src = getImageSrc(item.image_url);
    img.alt = item.name;
    img.loading = 'lazy';

    img.addEventListener('error', function () {
        img.src = PLACEHOLDER_IMAGE;
    });

    imageWrapper.appendChild(img);

    /* текстовый блок */
    const content = document.createElement('div');
    content.className = 'product-content';

    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = item.category;

    const title = document.createElement('h2');
    title.textContent = item.name;

    const description = document.createElement('p');
    description.className = 'product-description';
    description.textContent = item.description || '';

    const info = document.createElement('div');
    info.className = 'product-info';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = formatPrice(item.price);

    const stock = document.createElement('span');
    stock.className = 'product-stock';
    stock.textContent = item.quantity > 0
        ? 'В наличии: ' + item.quantity
        : 'Нет в наличии';

    if (item.quantity === 0) {
        stock.classList.add('product-stock--empty');
    }

    info.appendChild(price);
    info.appendChild(stock);

    /* кнопки удаления и изменения */
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.marginTop = '14px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'card-delete';
    editBtn.dataset.action = 'edit';
    editBtn.textContent = 'Изменить';
    editBtn.style.marginTop = '0';
    editBtn.style.background = '#e0f2fe';
    editBtn.style.color = '#0369a1';
    editBtn.style.borderColor = '#bae6fd';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'card-delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.textContent = 'Удалить';
    deleteBtn.style.marginTop = '0';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    content.appendChild(category);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(info);
    content.appendChild(actions);

    card.appendChild(imageWrapper);
    card.appendChild(content);

    return card;
}


/* перерисовка всего списка */
function render() {
    const visibleItems = getVisibleItems();

    elements.productsContainer.replaceChildren();

    if (visibleItems.length === 0) {
        elements.emptyMessage.hidden = false;
    } else {
        elements.emptyMessage.hidden = true;
    }

    const fragment = document.createDocumentFragment();

    visibleItems.forEach(function (item) {
        fragment.appendChild(createProductCard(item));
    });

    elements.productsContainer.appendChild(fragment);

    elements.resultsInfo.textContent =
        'Показано товаров: ' + visibleItems.length + ' из ' + state.items.length;
}


/* РАБОТА С СЕРВЕРОМ (REST API) */

/* загрузка всех товаров с сервера */
async function loadProducts() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/products/');
        if (!response.ok) throw new Error('Ошибка загрузки: ' + response.status);

        state.items = await response.json();
        render();
    } catch (error) {
        console.error(error);
        alert('Не удалось загрузить данные. Убедитесь, что backend запущен.');
    }
}


/* добавление товара */
async function addItem(data) {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/products/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                category: data.category,
                price: Number(data.price),
                quantity: Number(data.quantity),
                description: data.description,
                image_url: data.image
            })
        });

        if (!response.ok) throw new Error('Ошибка создания: ' + response.status);

        await loadProducts();
        closeModal();
    } catch (error) {
        console.error(error);
        alert('Не удалось добавить товар');
    }
}


/* обновление товара */
async function updateItem(id, data) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                category: data.category,
                price: Number(data.price),
                quantity: Number(data.quantity),
                description: data.description,
                image_url: data.image
            })
        });

        if (!response.ok) throw new Error('Ошибка обновления: ' + response.status);

        await loadProducts();
        closeModal();
    } catch (error) {
        console.error(error);
        alert('Не удалось обновить товар');
    }
}


/* удаление товара */
async function deleteItemById(id) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
            method: 'DELETE'
        });

        if (response.status !== 204) throw new Error('Ошибка удаления: ' + response.status);

        await loadProducts();
    } catch (error) {
        console.error(error);
        alert('Не удалось удалить товар');
    }
}


/* открытие модального окна */
function openModal(mode = 'create', item = null) {
    elements.modal.hidden = false;
    document.body.style.overflow = 'hidden';

    if (mode === 'edit' && item) {
        /* Режим редактирования */
        state.editingId = item.id;
        elements.modalTitle.textContent = 'Редактировать товар';
        elements.modalSubmitBtn.textContent = 'Сохранить';

        /* Заполняем форму текущими данными */
        elements.productForm.elements['name'].value = item.name;
        elements.productForm.elements['category'].value = item.category;
        elements.productForm.elements['price'].value = item.price;
        elements.productForm.elements['quantity'].value = item.quantity;
        elements.productForm.elements['description'].value = item.description || '';
        elements.productForm.elements['image'].value = item.image_url || '';
    } else {
        /* Режим создания */
        state.editingId = null;
        elements.modalTitle.textContent = 'Добавить товар';
        elements.modalSubmitBtn.textContent = 'Добавить';
        elements.productForm.reset();
    }

    clearAllErrors();

    const firstInput = elements.productForm.querySelector('input');
    if (firstInput) {
        firstInput.focus();
    }
}


/* закрытие модального окна */
function closeModal() {
    elements.modal.hidden = true;
    elements.productForm.reset();
    clearAllErrors();
    state.editingId = null;
    document.body.style.overflow = '';
}


/* очистка ошибки одного поля */
function clearError(field) {
    field.classList.remove('is-invalid');

    const errorEl = document.querySelector('[data-error-for="' + field.id + '"]');
    if (errorEl) {
        errorEl.textContent = '';
    }
}


/* показ ошибки под полем */
function showError(field, message) {
    field.classList.add('is-invalid');

    const errorEl = document.querySelector('[data-error-for="' + field.id + '"]');
    if (errorEl) {
        errorEl.textContent = message;
    }
}


/* очистка всех ошибок */
function clearAllErrors() {
    const fields = elements.productForm.querySelectorAll('input, select, textarea');
    fields.forEach(function (field) {
        clearError(field);
    });
}


/* проверка одного поля */
function validateField(field) {
    clearError(field);

    if (field.validity.valid) {
        return null;
    }

    if (field.validity.valueMissing) {
        if (field.tagName === 'SELECT') {
            return 'Выберите категорию';
        }
        return 'Заполните это поле';
    }

    if (field.validity.tooShort) {
        return 'Минимум ' + field.minLength + ' символа';
    }

    if (field.validity.tooLong) {
        return 'Максимум ' + field.maxLength + ' символов';
    }

    if (field.validity.rangeUnderflow) {
        return 'Значение не может быть меньше ' + field.min;
    }

    if (field.validity.rangeOverflow) {
        return 'Значение не может быть больше ' + field.max;
    }

    if (field.validity.typeMismatch) {
        return 'Некорректный формат';
    }

    if (field.validity.badInput) {
        return 'Введите число';
    }

    return 'Некорректное значение';
}


/* ОБРАБОТЧИКИ СОБЫТИЙ */

/* поиск */
elements.searchInput.addEventListener('input', function (event) {
    state.searchQuery = event.target.value;
    render();
});


/* фильтр по категории */
elements.categoryFilter.addEventListener('change', function (event) {
    state.selectedCategory = event.target.value;
    render();
});


/* сортировка */
elements.sortSelect.addEventListener('change', function (event) {
    state.sortBy = event.target.value;
    render();
});


/* делегирование кликов по карточкам: удаление и изменение */
elements.productsContainer.addEventListener('click', function (event) {
    const deleteBtn = event.target.closest('[data-action="delete"]');
    const editBtn = event.target.closest('[data-action="edit"]');

    if (deleteBtn) {
        const card = deleteBtn.closest('.product-card');
        if (!card) return;
        const id = Number(card.dataset.id);

        if (window.confirm('Удалить этот товар?')) {
            deleteItemById(id);
        }
    } else if (editBtn) {
        const card = editBtn.closest('.product-card');
        if (!card) return;
        const id = Number(card.dataset.id);
        const item = state.items.find(function (p) { return p.id === id; });
        if (item) {
            openModal('edit', item);
        }
    }
});


/* открытие модалки (кнопка "Добавить товар") */
elements.openModalBtn.addEventListener('click', function () {
    openModal('create');
});


/* закрытие модалки по клику на data-close */
elements.modal.addEventListener('click', function (event) {
    if (event.target.hasAttribute('data-close')) {
        closeModal();
    }
});


/* закрытие модалки по escape */
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !elements.modal.hidden) {
        closeModal();
    }
});


/* отправка формы */
elements.productForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const fields = elements.productForm.querySelectorAll('input, select, textarea');
    let firstInvalid = null;

    fields.forEach(function (field) {
        const errorMessage = validateField(field);
        if (errorMessage) {
            showError(field, errorMessage);
            if (!firstInvalid) {
                firstInvalid = field;
            }
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
        return;
    }

    const formData = new FormData(elements.productForm);

    const formValues = {
        name: (formData.get('name') || '').toString().trim(),
        category: (formData.get('category') || '').toString(),
        price: Number(formData.get('price')),
        quantity: Number(formData.get('quantity')),
        description: (formData.get('description') || '').toString().trim(),
        image: (formData.get('image') || '').toString().trim()
    };

    /* Проверяем режим: редактирование или создание */
    if (state.editingId !== null) {
        updateItem(state.editingId, formValues);
    } else {
        addItem(formValues);
    }
});


/* сброс ошибки поля при вводе */
elements.productForm.addEventListener('input', function (event) {
    const field = event.target;
    if (field.matches('input, select, textarea')) {
        clearError(field);
    }
});


/* ИНИЦИАЛИЗАЦИЯ */

loadProducts();