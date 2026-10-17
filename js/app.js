'use strict';


/* ключ для localStorage */
const STORAGE_KEY = 'electronics_warehouse_items_v1';


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


/*  товары при первом запуске */
const DEFAULT_ITEMS = [
    {
        id: 1,
        name: 'Ноутбук HP Pavilion',
        category: 'Электроника',
        price: 45000,
        quantity: 1,
        description: 'Игровой ноутбук с процессором Intel Core i5',
        image: 'assets/images/laptop.jpg'
    },
    {
        id: 2,
        name: 'Мышь Logitech MX Master',
        category: 'Аксессуары',
        price: 1200,
        quantity: 11,
        description: 'Беспроводная мышь для профессионалов',
        image: 'assets/images/mouse.jpg'
    },
    {
        id: 3,
        name: 'Клавиатура механическая',
        category: 'Аксессуары',
        price: 2500,
        quantity: 6,
        description: 'Механическая клавиатура с RGB подсветкой',
        image: 'assets/images/keyboard.jpg'
    },
    {
        id: 4,
        name: 'Монитор 24" Samsung',
        category: 'Электроника',
        price: 15000,
        quantity: 2,
        description: 'Монитор с IPS матрицей',
        image: 'assets/images/monitor.jpg'
    },
    {
        id: 5,
        name: 'Веб-камера Logitech',
        category: 'Аксессуары',
        price: 800,
        quantity: 10,
        description: 'Веб-камера Full HD для видеоконференций',
        image: 'assets/images/webcam.jpg'
    },
    {
        id: 6,
        name: 'Наушники Sony WH-1000XM4',
        category: 'Аксессуары',
        price: 12000,
        quantity: 0,
        description: 'Беспроводные наушники с шумоподавлением',
        image: 'assets/images/headphones.jpg'
    },
    {
        id: 7,
        name: 'Жесткий диск 1TB',
        category: 'Комплектующие',
        price: 3500,
        quantity: 2,
        description: 'Внутренний жесткий диск для ПК',
        image: 'assets/images/hdd.jpg'
    },
    {
        id: 8,
        name: 'Оперативная память 16GB',
        category: 'Комплектующие',
        price: 2800,
        quantity: 10,
        description: 'Модуль оперативной памяти DDR4',
        image: 'assets/images/ram.jpg'
    }
];


/* состояние приложения */
const state = {
    items: [],
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'name-asc'
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
    productForm:       document.getElementById('product-form')
};


/* загрузка товаров из localStorage */
function loadItemsFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return null;
    } catch (err) {
        console.error('Ошибка чтения localStorage:', err);
        return null;
    }
}


/* сохранение товаров в localStorage */
function saveItemsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (err) {
        console.error('Ошибка записи в localStorage:', err);
    }
}


/* генерация id */
function generateId() {
    return Date.now();
}


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
    img.src = getImageSrc(item.image);
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

    /* кнопка удаления */
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'card-delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.textContent = 'Удалить';

    content.appendChild(category);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(info);
    content.appendChild(deleteBtn);

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


/* добавление товара */
function addItem(data) {
    const newItem = {
        id: generateId(),
        name: data.name,
        category: data.category,
        price: Number(data.price),
        quantity: Number(data.quantity),
        description: data.description,
        image: data.image
    };

    state.items.unshift(newItem);

    saveItemsToStorage();
    render();
}


/* удаление товара по id */
function deleteItemById(id) {
    state.items = state.items.filter(function (item) {
        return item.id !== id;
    });

    saveItemsToStorage();
    render();
}


/* открытие модального окна */
function openModal() {
    elements.modal.hidden = false;

    const firstInput = elements.productForm.querySelector('input');
    if (firstInput) {
        firstInput.focus();
    }

    document.body.style.overflow = 'hidden';
}


/* закрытие модального окна */
function closeModal() {
    elements.modal.hidden = true;

    elements.productForm.reset();
    clearAllErrors();

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


/* удаление через делегирование */
elements.productsContainer.addEventListener('click', function (event) {
    const deleteBtn = event.target.closest('[data-action="delete"]');

    if (!deleteBtn) {
        return;
    }

    const card = deleteBtn.closest('.product-card');
    if (!card) {
        return;
    }

    const id = Number(card.dataset.id);

    const confirmed = window.confirm('Удалить этот товар?');
    if (confirmed) {
        deleteItemById(id);
    }
});


/* открытие модалки */
elements.openModalBtn.addEventListener('click', function () {
    openModal();
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

    const newItem = {
        name: (formData.get('name') || '').toString().trim(),
        category: (formData.get('category') || '').toString(),
        price: Number(formData.get('price')),
        quantity: Number(formData.get('quantity')),
        description: (formData.get('description') || '').toString().trim(),
        image: (formData.get('image') || '').toString().trim()
    };

    addItem(newItem);
    closeModal();
});


/* сброс ошибки поля при вводе */
elements.productForm.addEventListener('input', function (event) {
    const field = event.target;
    if (field.matches('input, select, textarea')) {
        clearError(field);
    }
});


/* инициализация приложения */
function init() {
    const storedItems = loadItemsFromStorage();

    if (storedItems) {
        state.items = storedItems;
    } else {
        state.items = DEFAULT_ITEMS.slice();
        saveItemsToStorage();
    }

    render();
}

init();