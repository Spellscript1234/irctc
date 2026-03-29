// --- original top part (keep as is) ---
const from = document.getElementById('from');
const too = document.getElementById('to');
let date = document.getElementById('date');
const sub = document.getElementById('sub');
let info = {};
const searching = document.getElementById('searching');
let flag = 0;

async function getstations() {
  const data = await fetch('stations.json');
  return await data.json();
}

async function gettrains() {
  const data = await fetch('trains.json');
  return await data.json();
}

async function getindex(city) {
  const result = await getstations();
  const index = result.stations.findIndex(station => station.name === city);
  return index;
}

// --- replace old searchtrains and checkall with these ---
async function searchtrains(fromCode, toCode, day) {
  const alltrains = await gettrains();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[day];

  const results = alltrains.trains.filter(train => {
    if (!train.runs_on.includes(dayName)) return false;
    const fromStop = train.schedule.find(s => s.station_code === fromCode);
    const toStop = train.schedule.find(s => s.station_code === toCode);
    return fromStop && toStop && fromStop.distance < toStop.distance;
  });

  if (results.length === 0) {
    searching.innerText = 'No trains found!';
  } else {
    results.forEach(train => {
      const fromStop = train.schedule.find(s => s.station_code === fromCode);
      const toStop = train.schedule.find(s => s.station_code === toCode);
      const distance = toStop.distance - fromStop.distance;
      const price = (distance * train.price_per_km).toFixed(2);
      const card = document.createElement('div');
      card.innerHTML = `
        <h3>${train.train_name} (${train.train_id})</h3>
        <p>Departure: ${fromStop.time} → Arrival: ${toStop.time}</p>
        <p>Distance: ${distance} km | Price: ₹${price}</p>
        <p>Runs on: ${train.runs_on.join(', ')}</p>
      `;
      document.querySelector('.results').appendChild(card);
    });
  }
}

async function checkall() {
  const fro = from.value;
  const to = too.value;
  const stationsData = await getstations();

  const fromStation = stationsData.stations.find(s => s.name === fro);
  const toStation = stationsData.stations.find(s => s.name === to);

  if (!fromStation || !toStation) {
    searching.innerText = 'One or both stations not found!';
    return;
  }

  let val = date.value;
  const [year, month, day_num] = val.split('-').map(Number);
  const day = new Date(year, month - 1, day_num).getDay();
  const dateObj = new Date(year, month - 1, day_num);

  document.querySelector('.results').innerHTML = '<h4 id="searching"></h4>';
  document.getElementById('searching').innerText =
    `Trains from ${fro} to ${to} on ${dateObj.toDateString()}`;

  searchtrains(fromStation.code, toStation.code, day);
}

// --- original event listener (keep as is) ---
sub.addEventListener('click', checkall);