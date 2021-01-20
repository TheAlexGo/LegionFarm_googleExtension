let config = ''

let xhr = new XMLHttpRequest();
xhr.open('GET', chrome.extension.getURL('settings/config.json'), false)
xhr.send();
if (xhr.status === 200) {
    config = JSON.parse(xhr.responseText)
}

let id_interval = 0
let sleepTime = config["timeSleep"]
// sleepTime = 4
async function soundClick() {
    // Функция вызова звука
    console.log('Звук')
    let src = chrome.extension.getURL('sound/sound_new.mp3')
    // let src = 'chrome-extension://klgmdgedkohndbmnbepmegggleegbdll/sound_new.mp3'
    let audio = new Audio();
    audio.src = src;
    audio.autoplay = true;
}

function create_window(desc, CS, price, affiliation){
    let div = document.createElement('div');
    div.id = 'new_order_popup'
    document.querySelector('body').append(div)
    document.querySelector('#new_order_popup').innerHTML = `<div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, .5)">
    <div style="display: block; position: fixed; left: 0; right: 0; margin: auto; width: 50%; top: 10%; background-color: #fff; padding: 25px;" >
    <h1 style="text-align: center">Новый заказ!</h1>
    <div>
        <div style="font-size: 20px;">
            <div>${desc}</div>
        </div>
    </div>
    <div>
        <div style="font-size: 20px;">Платформа: ${affiliation}</div>
    </div>
    <div>
        <div style="font-size: 20px;">${CS}</div>
    </div>
    <div>
        <div style="font-size: 20px;">Цена: ${price}$</div>
    </div>
    <div style="margin-top: 30px; width: 100%; display: flex; justify-content: space-between;">
     <button style="width: 40%;
      padding: 10px;
      border-radius: 10px;
      background-color: #28a745;
      color: #fff;
      border: 0;
      font-size: 20px;
      cursor: pointer;
     " id="accept">Принять</button>
     <button style="width: 40%;
      padding: 10px;
      border-radius: 10px;
      background-color: #dc3545;
      color: #fff;
      border: 0;
      font-size: 20px;
      cursor: pointer;
      " id="deny">Отклонить</button>
 </div>
</div>
</div>`
    document.getElementById('accept').onclick = async function () {
        await acceptOrder()
    }
    document.getElementById('deny').onclick = async function(){
        await denyOrder()
    }
}

function compare(dict1, dict2) {
    // Функция нахождения разницы между двумя списками
    return dict1.filter(i => !dict2.includes(i)).concat(dict2.filter(i => !dict1.includes(i)))
}

function getProps(new_lot){
    // Функция получения параметров заказа

    const id_block = new_lot[new_lot.length-1] // id блока
    const block_tr = document.querySelector('tr[data-key="'+id_block+'"]') // сам блок заказа
    if(block_tr === null){
        console.log('Заказа не существует!')
        chrome.storage.local.remove('new_lot')
        location.reload()
        return 0
    }
    else{
        soundClick().then()
        // Получение Cross-Save
        const CS_block = block_tr.querySelectorAll('td')[11].textContent.split('\n')
        const index_props_CS = CS_block.findIndex(function (str) {
            let mas = str.split(': ')
            return mas[0] === 'Cross-Save'
        })

        const CS_available = index_props_CS !== -1 ? CS_block[index_props_CS] : ''
        const description = block_tr.querySelectorAll('td')[9].innerText
            .replace('I do not understand what needs to be done', '')
            .replace('Заказ с обязательной трансляцией на YouTube!', '')
            .replace('Order with a mandatory YouTube broadcast!', '')
        const price = block_tr.querySelectorAll('td')[6].innerText.replace('With stream', '')
        const affiliation = block_tr.querySelectorAll('td')[4].innerText

        return [description, CS_available, price, affiliation]
    }

}

async function getBlocks(url){
    // Функция получения всех блоков заказов
    return new DOMParser().parseFromString((await (await fetch(url)).text()), 'text/html')
        .body.querySelector(".container")
        .querySelector(".right_col")
        .querySelector(".grid-view")
        .querySelector("tbody")
        .querySelectorAll("tr")
}

async function acceptOrder(){
    // Функция принятия заказа
    let new_lot = await getValueStorage('new_lot')
    let id_block = new_lot[new_lot.length-1] // номер нового лота
    chrome.storage.local.remove('new_lot', async function () {
        console.log('Заказ принят')
    }) // После принятия заказа - очистить new_lot в chrome storage
    const confirm_button = document.querySelector('tr[data-key="'+id_block+'"]').querySelectorAll('td')[1].querySelector('.js-confirm-order-btn')
    confirm_button.click() // Кнопка "Accept"
    const popup_confirm_button = document.querySelector('#js-booster-confirm-order-form-modal').querySelector('.btn-success')
    popup_confirm_button.click() // Кнопка "Confirm"

    const close_button = document.querySelectorAll('.btn-success#redirect-booster')
    if(close_button.length > 0){
        console.log('Заказ забрали!')
        location.reload()
    }
    // setTimeout(() => { location.reload() }, sleepTime * 1000)
}

async function denyOrder(){
    // Функция отклонения заказа
    chrome.storage.local.remove('new_lot', async function () {
        console.log('Заказ отклонён')
    })
    location.reload()
}

async function script() {
    console.clear()


    // Если на сайте возникнет ошибка -> перезагрузить
    // if (document.querySelectorAll('center').length !== 0) location.reload()

    let old_dict = await getValueStorage('old_list') // Получение прошлого списка
    old_dict === undefined ? old_dict = [] : ''
    const url = location.href
    // Получение всех блоков заказов
    const blocks = await getBlocks(url)
    let dict = [] // Объявление нового списка

    if (blocks.length !== 0)
    {
        // Сбор всех заказов в один массив
        blocks.forEach(function (block) {
            dict.push(block.getAttribute('data-key'))
        })
        console.log('Старый список: ')
        console.log(old_dict)
        console.log(`Новый список: `)
        console.log(dict)
        let new_lot = dict.filter(i => !old_dict.includes(i))
        let buy_lot = old_dict.filter(i => !dict.includes(i))
        if (compare(old_dict, dict).length !== 0)
        {
            new_lot.length !== 0 ? console.log('Новый лот: ', new_lot) : ''
            buy_lot.length !== 0 ? console.log('Куплен лот: ', buy_lot) : ''
            chrome.storage.local.set({old_list: dict}, function() {
                console.log('Новый список: ' + JSON.stringify(dict));
            });
        }

        // Новый товар
        if (new_lot.length !== 0){
            chrome.storage.local.set({new_lot: new_lot});
            window.open (url,'_self',false)

        }
    }
}

async function start_end_script(value) {
    // Функция старта скрипта
    let start_dict = (await getValueStorage('old_list')) !== undefined ? (await getValueStorage('old_list')) : []
    chrome.storage.local.set({active: value, old_list: start_dict}, function() {
        console.log('Состояния скрипта: ' + value + '\nПрошлый список: ' + start_dict);
    });
    chrome.tabs.executeScript({
        code: 'location.reload();'})
}

async function clear() {
    // Очистка списков
    chrome.storage.local.remove('old_list', async function () {
        console.log('Список очищен: ' + await getValueStorage('old_list'))
    })
    chrome.storage.local.remove('active', async function () {
        console.log('Активность очищена: ' + await getValueStorage('active'))
    })
    chrome.storage.local.remove('new_lot', async function () {
        console.log('Новый лот очищен: ' + await getValueStorage('new_lot'))
    })
}

async function getValueStorage(key) {
    // Функция вывода значения из хранилища chrome
    async function getValue(name) {
        return new Promise(resolve => {
            chrome.storage.local.get(name, data => {
                resolve(data)
            })
        })
    }
    let a = await getValue(key)
    return a[key]
}

window.addEventListener('load', async function() {
    // Начало скрипта. Запуск после загрузки DOM

    // Для гифки у лого
    let gif_work = document.createElement('div')
    gif_work.id = "gif_work"
    document.querySelector('.navbar-right').append(gif_work)
    document.querySelector('ul.navbar-right').setAttribute('style', 'display: flex; width: auto;')


    let result = await getValueStorage('active') // Активность: 1 - активно, 0 - не авктивно
    let new_lot = await getValueStorage('new_lot') // Новый лот
    if (result === 1)
    {
        console.log('Скрипт работает!')
        document.querySelector("#gif_work").innerHTML = `
            <img src="${chrome.extension.getURL('images/work.gif')}" style="width: 100px;" alt="Работает"/>`

        let now_link = location.href
        now_link = now_link.split('/')
        now_link = now_link[now_link.length-1]
        if(now_link !== 'popup.html'){
            if(new_lot !== undefined && new_lot !== [null])
            {
                let props_order = getProps(new_lot)
                console.log(props_order)
                if(props_order !== 0) create_window(props_order[0], props_order[1], props_order[2], props_order[3])
            }
            else if(new_lot === [null]) console.log('Ошибка заказов! Обновите страницу!')
            else id_interval = setInterval(await script, sleepTime * 1000)
        }
    }
    else
    {
        console.log('Скрипт выключен!')
        document.querySelector("#gif_work").innerHTML = `
            <img src="${chrome.extension.getURL('images/not_work.gif')}" style="width: 100px;" alt="Не работает"/>`
    }



})

document.addEventListener('keydown', function(event) {
    if (event.code === 'Key'+config['acceptButton']) {
        acceptOrder().then()
    }
    if (event.code === 'Key'+config['denyButton']) {
        denyOrder().then()
    }
    if (event.code === 'Key'+config['soundButton']) {
        soundClick().then()
    }
});

if (document.querySelectorAll('#button_ext').length === 1 &&
    document.querySelectorAll('#button_ext_off').length === 1 &&
    document.querySelectorAll('#clear').length === 1)
{
    document.getElementById('button_ext').onclick = function () {
        start_end_script(1).then(r => console.log(r))
    }
    document.getElementById('button_ext_off').onclick = function () {
        start_end_script(0).then(r => console.log(r))
    }

    document.getElementById('clear').onclick = function () {
        clear().then(r => console.log(r))
    }
}