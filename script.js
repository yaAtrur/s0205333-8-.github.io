
"use strict";

// Получил необходимые элементы страницы по их идентификаторам
const openBtn = document.getElementById("openForm");
const closeBtn = document.getElementById("closeForm");
const popup = document.getElementById("popup");
const form = document.getElementById("feedbackForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("status");

// Создал ключ для хранения данных формы в LocalStorage
const STORAGE_KEY = "feedbackFormData";

// Указал адрес сервиса Formcarry для отправки данных формы
// Здесь необходимо заменить значение на свой Form ID
const FORM_ENDPOINT = "https://formcarry.com/s/j_rW3tRMmI4";

// Создал переменную для проверки состояния всплывающего окна
let isPopupOpen = false;

// Функция открытия всплывающего окна
function showPopup() {

    // Проверяю, не открыто ли уже окно
    if (isPopupOpen) {
        return;
    }

    // Изменяю состояние окна на открытое
    isPopupOpen = true;

    // Добавляю класс active для отображения всплывающего окна
    popup.classList.add("active");

    // Сообщаю вспомогательным технологиям, что окно открыто
    popup.setAttribute("aria-hidden", "false");

    // Запрещаю прокрутку основной страницы при открытом окне
    document.body.style.overflow = "hidden";

    // Меняю URL страницы с помощью History API
    const newUrl = new URL(window.location.href);

    // Добавляю параметр feedback=open в адресную строку
    newUrl.searchParams.set("feedback", "open");

    // Добавляю новую запись в историю браузера
    history.pushState(
        { feedbackPopup: true },
        "",
        newUrl
    );

    // Убираю фокус с кнопки открытия формы
    openBtn.blur();

    // Перевожу курсор в поле ввода ФИО
    document.getElementById("fio").focus();
}

// Функция закрытия всплывающего окна
function hidePopup() {

    // Проверяю, открыто ли окно
    if (!isPopupOpen) {
        return;
    }

    // Если окно было открыто через pushState,
    // возвращаюсь к предыдущей записи истории браузера
    if (history.state && history.state.feedbackPopup) {
        history.back();
    } else {

        // Если записи нет, закрываю окно напрямую
        closePopupView();
    }
}

// Функция непосредственного закрытия всплывающего окна
function closePopupView() {

    // Изменяю состояние окна на закрытое
    isPopupOpen = false;

    // Удаляю класс active, чтобы скрыть окно
    popup.classList.remove("active");

    // Сообщаю вспомогательным технологиям, что окно закрыто
    popup.setAttribute("aria-hidden", "true");

    // Возвращаю возможность прокрутки страницы
    document.body.style.overflow = "";

    // Возвращаю фокус на кнопку открытия формы
    openBtn.focus();
}

// Отслеживаю нажатие кнопки "Назад" в браузере
window.addEventListener("popstate", function () {

    // Если окно открыто, закрываю его
    if (isPopupOpen) {
        closePopupView();
    }
});

// Открываю всплывающее окно при нажатии на соответствующую кнопку
openBtn.addEventListener("click", showPopup);

// Закрываю всплывающее окно при нажатии на крестик
closeBtn.addEventListener("click", hidePopup);

// Закрываю окно при нажатии на затемнённую область
popup.addEventListener("click", function (event) {

    // Проверяю, что нажатие произошло именно на фон, а не на содержимое окна
    if (event.target === popup) {
        hidePopup();
    }
});

// Отслеживаю нажатие клавиш на клавиатуре
document.addEventListener("keydown", function (event) {

    // Закрываю окно при нажатии Escape, если оно открыто
    if (event.key === "Escape" && isPopupOpen) {
        hidePopup();
    }
});

// Функция сохранения введённых данных в LocalStorage
function saveFormData() {

    // Получаю все данные из формы
    const formData = new FormData(form);

    // Создаю объект для хранения значений полей
    const data = {};

    // Перебираю все данные формы и записываю их в объект
    formData.forEach(function (value, key) {
        data[key] = value;
    });

    // Отдельно сохраняю состояние чекбокса согласия
    data.agreement =
        document.getElementById("agreement").checked;

    // Преобразую объект в JSON и сохраняю его в LocalStorage
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}

// Функция восстановления ранее сохранённых данных формы
function restoreFormData() {

    // Получаю сохранённые данные из LocalStorage
    const savedData = localStorage.getItem(STORAGE_KEY);

    // Если сохранённых данных нет, завершаю выполнение функции
    if (!savedData) {
        return;
    }

    try {

        // Преобразую сохранённую JSON-строку обратно в объект
        const data = JSON.parse(savedData);

        // Перебираю все сохранённые поля формы
        Object.keys(data).forEach(function (key) {

            // Получаю нужное поле формы по его имени
            const field = form.elements.namedItem(key);

            // Если поле является чекбоксом, восстанавливаю его состояние
            if (field && field.type === "checkbox") {
                field.checked = data[key];

            // Для остальных полей восстанавливаю введённое значение
            } else if (field) {
                field.value = data[key];
            }
        });

    } catch (error) {

        // Удаляю сохранённые данные, если их не удалось прочитать
        localStorage.removeItem(STORAGE_KEY);
    }
}

// Сохраняю данные при вводе текста в поля формы
form.addEventListener("input", saveFormData);

// Сохраняю данные при изменении значений элементов формы
form.addEventListener("change", saveFormData);

// Восстанавливаю сохранённые данные после загрузки страницы
restoreFormData();

// Обрабатываю отправку формы без перезагрузки страницы
form.addEventListener("submit", async function (event) {

    // Отменяю стандартную отправку формы
    event.preventDefault();

    // Очищаю предыдущее сообщение о результате отправки
    statusMessage.textContent = "";
    statusMessage.className = "";

    // Блокирую кнопку, чтобы избежать повторной отправки
    submitBtn.disabled = true;

    // Изменяю текст кнопки на время отправки
    submitBtn.textContent = "Отправка...";

    try {

        // Отправляю данные формы на сервер через Fetch API
        const response = await fetch(FORM_ENDPOINT, {
            method: "POST",
            body: new FormData(form),
            headers: {
                Accept: "application/json"
            }
        });

        // Проверяю, успешно ли прошёл запрос
        if (!response.ok) {
            throw new Error("Ошибка отправки данных");
        }

        // Отображаю сообщение об успешной отправке
        statusMessage.textContent =
            "Спасибо! Ваше сообщение успешно отправлено.";

        // Добавляю класс для отображения сообщения зелёным цветом
        statusMessage.className = "success";

        // Очищаю все поля формы после успешной отправки
        form.reset();

        // Удаляю ранее сохранённые данные из LocalStorage
        localStorage.removeItem(STORAGE_KEY);

    } catch (error) {

        // Отображаю сообщение об ошибке отправки
        statusMessage.textContent =
            "Не удалось отправить сообщение. Попробуйте ещё раз.";

        // Добавляю класс для отображения сообщения красным цветом
        statusMessage.className = "error";

    } finally {

        // Разблокирую кнопку после завершения отправки
        submitBtn.disabled = false;

        // Возвращаю первоначальный текст кнопки
        submitBtn.textContent = "Отправить";
    }
});
