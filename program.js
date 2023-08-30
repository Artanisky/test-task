// Маршрут водителя
const taxiCoords = {
    startLat: 62.0535283279523,
    startLng: 129.71718549728396,
    endLat: 62.02913762507999,
    endLng: 129.7291159629822
}

// Массив заказов
const taskCoords = [
    {
        id: 1,
        startLat: 62.0504258744295,
        startLng: 129.7324848175049,
        endLat: 62.04770028123243,
        endLng: 129.75608825683597,
        distance: null,
    },
    {
        id: 2,
        startLat: 62.05429760697986,
        startLng: 129.70713257789615,
        endLat: 62.04580429094244,
        endLng: 129.7228825092316,
        distance: null,
    },
    {
        id: 3,
        startLat: 62.051708126187556,
        startLng: 129.7167241573334,
        endLat: 62.034269898802684,
        endLng: 129.73890066146853,
        distance: null,
    },
    {
        id: 4,
        startLat: 62.059194390858366,
        startLng: 129.72175598144534,
        endLat: 62.0007435377763,
        endLng: 129.69978332519534,
        distance: null,
    },
]

// Функция для вычисления кратчайшего расстояния по поверхности земли – по формуле Хаверсин
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

// Функция для преобразования значений из градусов в радианы
function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// Функция возвращает id и расстояние самого короткого заказа
function calculate() {
    taskCoords.forEach((item, key) => {
        // Расстояние (начало таксист => начало заказа)
        const distance1 = getDistanceFromLatLonInKm(taxiCoords.startLat, taxiCoords.startLng, item.startLat, item.startLng)
        // Расстояние (начало заказа => конец заказа)
        const distance2 = getDistanceFromLatLonInKm(item.startLat, item.startLng, item.endLat, item.endLng)
        // Расстояние (конец заказа => конец таксиста)
        const distance3 = getDistanceFromLatLonInKm(item.endLat, item.endLng, taxiCoords.endLat, taxiCoords.endLng)
        // Сохраняет сумму подсчитанных расстояний
        taskCoords[key].distance = distance1 + distance2 + distance3
    })
    const shortestRoute = Math.min(...taskCoords.map(property => property.distance))
    const shortestRouteItem = taskCoords.find(function (item) {
        return item.distance === shortestRoute;
    });

    return 'id=' + shortestRouteItem.id + ', расстояние=' + shortestRoute + ' км'
}

console.log(calculate())