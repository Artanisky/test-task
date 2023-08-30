<script setup>
import {onMounted, ref} from 'vue'
import IconPointB from "@/components/icons/IconPointB.vue";
import IconPointA from "@/components/icons/IconPointA.vue";

const calculated = ref(false)
const calculated2gis = ref(false)
const shortestRoute = ref(null)
const shortestRoute2gis = ref(null)

const taxiCoords = ref({
    startLat: 62.0535283279523,
    startLng: 129.71718549728396,
    endLat: 62.02913762507999,
    endLng: 129.7291159629822,
    distance: null,
    distance2gis: null,
    time2gis: null,
})

const taskCoords = ref([
    {
        startLat: 62.0504258744295,
        startLng: 129.7324848175049,
        endLat: 62.04770028123243,
        endLng: 129.75608825683597,
        distance: null,
        distance2gis: null,
        time2gis: null,
    },
    {
        startLat: 62.05429760697986,
        startLng: 129.70713257789615,
        endLat: 62.04580429094244,
        endLng: 129.7228825092316,
        distance: null,
        distance2gis: null,
        time2gis: null,
    },
    {
        startLat: 62.051708126187556,
        startLng: 129.7167241573334,
        endLat: 62.034269898802684,
        endLng: 129.73890066146853,
        distance: null,
        distance2gis: null,
        time2gis: null,
    },
    {
        startLat: 62.059194390858366,
        startLng: 129.72175598144534,
        endLat: 62.0007435377763,
        endLng: 129.69978332519534,
        distance: null,
        distance2gis: null,
        time2gis: null,
    },
])
const clickedCoords = ref({
    lat: null,
    lng: null,
})
const map = ref(null);

// Загрузка карты
onMounted(() => {
    DG.then(function () {
        map.value = DG.map('container', {
            center: [62.049750, 129.705917],
            zoom: 13
        });
        map.value.on('click', function (e) {
            clickedCoords.value.lat = e.latlng.lat;
            clickedCoords.value.lng = e.latlng.lng;
        });
    });
})
// Добавление заказа
const addTask = () => {
    taskCoords.value.push({
        startLat: null,
        startLng: null,
        endLat: null,
        endLng: null,
        time2gis: null,
    })
}
// Удаление заказа
const deleteTask = (index) => {
    taskCoords.value.splice(index, 1)
}

// Подсчет по координатам
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус земли в км
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Расстояние в км
}

// Преобразует значение deg из градусов в радианы
function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// Функция просмотра данных, вызывается через кнопку
function watchData() {
    alert(JSON.stringify({
        taxiCoords: taxiCoords.value,
        taskCoords: taskCoords.value
    }, null, 4));
}

// Функция подсчета через формула Хаверсина
function calculate() {
    const taxi = taxiCoords.value
    taskCoords.value.forEach((item, key) => {
        // Расстояние (начало таксист => начало заказа)
        const distance1 = getDistanceFromLatLonInKm(taxi.startLat, taxi.startLng, item.startLat, item.startLng)
        // Расстояние (начало заказа => конец заказа)
        const distance2 = getDistanceFromLatLonInKm(item.startLat, item.startLng, item.endLat, item.endLng)
        // Расстояние (конец заказа => конец таксиста)
        const distance3 = getDistanceFromLatLonInKm(item.endLat, item.endLng, taxi.endLat, taxi.endLng)
        taskCoords.value[key].distance = distance1 + distance2 + distance3
    })
    calculated.value = true
    shortestRoute.value = Math.min(...taskCoords.value.map(property => property.distance))
}

async function calculate2gis() {
    const points = []
    taskCoords.value.forEach((item) => {
        points.push([
            {
                "lon": taxiCoords.value.startLng,
                "lat": taxiCoords.value.startLat,
                'type': "walking",
                "start": true
            },
            {
                "lon": item.startLng,
                "lat": item.startLat,
                'type': "pref",
            },
            {
                "lon": item.endLng,
                "lat": item.endLat,
                'type': "pref",
            },
            {
                "lon": taxiCoords.value.endLng,
                "lat": taxiCoords.value.endLat,
                'type': "walking",
            },
        ])
    });
    for (const [key, point] of points.entries()) {
        const body = {
            "points": point,
            "route_mode": "shortest",
            "traffic_mode": "statistics",
            "transport": "car",
            "output": "summary"
        }
        let response = await fetch('https://routing.api.2gis.com/routing/7.0.0/global?key=' + import.meta.env.VITE_2GIS_API, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        response.json().then((res) => {
            taskCoords.value[key].distance2gis = res.result[0].length
            taskCoords.value[key].time2gis = res.result[0].duration
        }).then(() => {
            calculated2gis.value = true
            shortestRoute2gis.value = Math.min(...taskCoords.value.map(property => property.distance2gis))
        })
    }
}
</script>

<template>
    <div class="max-w-screen-lg mx-auto px-8">
        <h4 class="text-4xl mt-12 font-medium">Задача</h4>
        <p class="text-2xl mt-2 mb-4">Написать алгоритм, который предложит водителю наиболее подходящие заказы по
            пути маршрута.</p>
        <hr class="mb-4">
        <div class="h-80 w-full mb-8 rounded-lg overflow-hidden">
            <div id="container" class="h-full w-full"></div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-12">
            <div class="col-span-2 md:col-span-1">
                <p class="text-3xl mt-6 mb-4 ">Входные данные</p>
                <div v-if="clickedCoords.lat !== null">
                    <p class="font-bold">Вы нажали:</p>
                    <p>lat:{{ clickedCoords.lat }} lng:{{ clickedCoords.lng }}</p>
                </div>
                <p class="font-bold">Маршрут водителя: </p>
                <div class="grid grid-cols-1 gap-x-2 sm:grid-cols-2">
                    <div class="relative mt-2 rounded-md shadow-sm">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <div class="flex items-center">
                                <IconPointA class="inline-block h-6 mr-0.5"/>
                                <span class="text-gray-500 text-xs">lat</span>
                            </div>
                        </div>
                        <input type="number" v-model.number="taxiCoords.startLat"
                               class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                    <div class="relative mt-2 rounded-md shadow-sm">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <div class="flex items-center">
                                <IconPointA class="inline-block h-6 mr-0.5"/>
                                <span class="text-gray-500 text-xs">lng</span>
                            </div>
                        </div>
                        <input type="number" v-model.number="taxiCoords.startLng"
                               class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                </div>
                <div class="grid grid-cols-1 gap-x-2 sm:grid-cols-2">
                    <div class="relative mt-2 rounded-md shadow-sm">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <div class="flex items-center">
                                <IconPointB class="inline-block h-6 mr-0.5"/>
                                <span class="text-gray-500 text-xs">lat</span>
                            </div>
                        </div>
                        <input type="number" v-model.number="taxiCoords.endLat"
                               class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                    <div class="relative mt-2 rounded-md shadow-sm">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <div class="flex items-center">
                                <IconPointB class="inline-block h-6 mr-0.5"/>
                                <span class="text-gray-500 text-xs">lng</span>
                            </div>
                        </div>
                        <input type="number" v-model.number="taxiCoords.endLng"
                               class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                    </div>
                </div>
                <p class="mt-4 mb-4 font-bold">Маршруты заказов</p>
                <div v-for="(task, index) in taskCoords" class="mt-4">
                    <p>Заказ №{{ index + 1 }}
                        <button @click="deleteTask(index)"
                                class="rounded-md border border-red-600 px-2 py-1 text-xs text-red-500 shadow-sm hover:bg-red-500 hover:text-white">
                            Удалить
                        </button>
                    </p>

                    <div class="grid grid-cols-1 gap-x-2 sm:grid-cols-2">
                        <div class="relative mt-2 rounded-md shadow-sm">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <div class="flex items-center">
                                    <IconPointA class="inline-block h-6 mr-0.5"/>
                                    <span class="text-gray-500 text-xs">lat</span>
                                </div>
                            </div>
                            <input type="number" v-model.number="task.startLat"
                                   class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                        </div>
                        <div class="relative mt-2 rounded-md shadow-sm">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <div class="flex items-center">
                                    <IconPointA class="inline-block h-6 mr-0.5"/>
                                    <span class="text-gray-500 text-xs">lng</span>
                                </div>
                            </div>
                            <input type="number" v-model.number="task.startLng"
                                   class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 gap-x-2 sm:grid-cols-2">
                        <div class="relative mt-2 rounded-md shadow-sm">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <div class="flex items-center">
                                    <IconPointB class="inline-block h-6 mr-0.5"/>
                                    <span class="text-gray-500 text-xs">lng</span>
                                </div>
                            </div>
                            <input type="number" v-model.number="task.endLat"
                                   class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                        </div>
                        <div class="relative mt-2 rounded-md shadow-sm">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <div class="flex items-center">
                                    <IconPointB class="inline-block h-6 mr-0.5"/>
                                    <span class="text-gray-500 text-xs">lng</span>
                                </div>
                            </div>
                            <input type="number" v-model.number="task.endLng"
                                   class="block text-sm w-full rounded-md border-0 py-1.5 pl-14 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"/>
                        </div>
                    </div>
                </div>
                <button @click="addTask"
                        class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm text-white shadow-sm hover:bg-indigo-500 mt-4">
                    Добавить новый
                </button>
            </div>
            <div class="col-span-2 md:col-span-1">
                <div class="px-8 py-6 bg-gray-100 rounded-lg">
                    <p class="text-3xl mb-4">Решение</p>
                    <button @click="watchData"
                            class="rounded-md bg-gray-600 px-3.5 py-2.5 text-sm text-white shadow-sm hover:bg-gray-500 mt-4">
                        Посмотреть данные
                    </button>
                    <br>
                    <button @click="calculate2gis"
                            class="rounded-md bg-gray-600 px-3.5 py-2.5 text-sm text-white shadow-sm hover:bg-gray-500 mt-4">
                        Подсчитать через 2GIS
                    </button>
                    <br>
                    <button @click="calculate"
                            class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm text-white shadow-sm hover:bg-indigo-500 mt-4">
                        Подсчитать
                    </button>
                    <div v-if="calculated">
                        <p class="font-bold">Результат подсчета</p>
                        <p>Длины у маршрутов</p>
                        <div v-for="(task, key) in taskCoords">
                            {{ key + 1 }}: {{ task.distance }} км
                        </div>
                        <p>Самый короткий маршрут занимает {{ shortestRoute }} км</p>
                    </div>
                    <div v-if="calculated2gis">
                        <p class="font-bold">Результат подсчета через API 2gis</p>
                        <p>Данные маршрутов из 2gis</p>
                        <div v-for="(task, key) in taskCoords">
                            {{ key + 1 }}: Расстояние {{ task.distance2gis }} метров и Время {{ task.time2gis }} секунд
                        </div>
                        <p>Самый короткий маршрут занимает {{ shortestRoute2gis }} метров</p>
                    </div>
                </div>
                <div class="px-8 py-6 bg-gray-100 mt-4 rounded-lg">
                    <p class="text-3xl mb-4">Подсказки</p>
                    <ul class="list-disc ml-4">
                        <li>Нажмите на карту, чтобы получить точные координаты</li>
                        <li>Тестовый токен API 2gis ограничен 3000 запросами, возможно, этого может быть
                            недостаточно(может закончиться)
                        </li>
                        <li>Если поля пусты или заполнены неправильно, расчет получен не будет</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>