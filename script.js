const from = document.getElementById('from');
const too = document.getElementById('to');
const date = document.getElementById('date');
const sub = document.getElementById('sub');
const searching = document.getElementById('searching');

// set minimum date to today so past dates cant be selected
const today = new Date().toISOString().split('T')[0];
date.min = today;

async function getstations() {
  const data = await fetch('stations.json');
  return await data.json();
}

async function gettrains() {
  const data = await fetch('trains.json');
  return await data.json();
}

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
      card.className = 'train-card';
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
  const val = date.value;

  // check if all fields are filled
  if (!fro || !to || !val) {
    alert('Please fill all fields!');
    return;
  }

  const stationsData = await getstations();

  const fromStation = stationsData.stations.find(
    s => s.name.toLowerCase() === fro.toLowerCase()
  );
  const toStation = stationsData.stations.find(
    s => s.name.toLowerCase() === to.toLowerCase()
  );

  if (!fromStation || !toStation) {
    searching.innerText = 'One or both stations not found!';
    return;
  }

  if (fromStation.code === toStation.code) {
    searching.innerText = 'From and To stations cannot be the same!';
    return;
  }

  // fix for correct day calculation
  const [year, month, day_num] = val.split('-').map(Number);
  const day = new Date(year, month - 1, day_num).getDay();
  const dateObj = new Date(year, month - 1, day_num);

  // clear old results before showing new ones
  document.querySelector('.results').innerHTML = '<h4 id="searching"></h4>';
  document.getElementById('searching').innerText =
    `Trains from ${fro} to ${to} on ${dateObj.toDateString()}`;

  searchtrains(fromStation.code, toStation.code, day);
}

sub.addEventListener('click', checkall);