// store results globally so sorting can access them
let currentResults = [];
let currentFromCode = '';
let currentToCode = '';

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function sortBy(type, order) {
  // highlight active sort button
  document.querySelectorAll('.sort-bar button').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  const sorted = [...currentResults].sort((a, b) => {
    if (type === 'price') {
      const fromStopA = a.schedule.find(s => s.station_code === currentFromCode);
      const toStopA = a.schedule.find(s => s.station_code === currentToCode);
      const fromStopB = b.schedule.find(s => s.station_code === currentFromCode);
      const toStopB = b.schedule.find(s => s.station_code === currentToCode);

      const priceA = (toStopA.distance - fromStopA.distance) * a.price_per_km;
      const priceB = (toStopB.distance - fromStopB.distance) * b.price_per_km;

      return order === 'asc' ? priceA - priceB : priceB - priceA;
    }

    if (type === 'duration') {
      const fromStopA = a.schedule.find(s => s.station_code === currentFromCode);
      const toStopA = a.schedule.find(s => s.station_code === currentToCode);
      const fromStopB = b.schedule.find(s => s.station_code === currentFromCode);
      const toStopB = b.schedule.find(s => s.station_code === currentToCode);

      const durationA = timeToMinutes(toStopA.time) - timeToMinutes(fromStopA.time);
      const durationB = timeToMinutes(toStopB.time) - timeToMinutes(fromStopB.time);

      return order === 'asc' ? durationA - durationB : durationB - durationA;
    }
  });

  displayTrains(sorted);
}

function openBookingPage(train) {
  const fromInput = document.getElementById('from').value.trim();
  const toInput = document.getElementById('to').value.trim();
  const journeyDate = document.getElementById('date').value;
  const fromStop = train.schedule.find(s => s.station_code === currentFromCode);
  const toStop = train.schedule.find(s => s.station_code === currentToCode);
  const distance = toStop.distance - fromStop.distance;
  const fare = (distance * train.price_per_km).toFixed(2);

  const params = new URLSearchParams({
    trainName: train.train_name,
    trainId: train.train_id,
    from: fromInput,
    to: toInput,
    date: journeyDate,
    departure: fromStop.time,
    arrival: toStop.time,
    fare: fare
  });

  window.location.href = `book-now.html?${params.toString()}`;
}

function displayTrains(trains) {
  // clear old cards but keep the heading
  const heading = document.getElementById('searching').innerText;
  document.querySelector('.results').innerHTML = '<h4 id="searching"></h4>';
  document.getElementById('searching').innerText = heading;

  if (trains.length === 0) {
    document.getElementById('searching').innerText = 'No trains found!';
    return;
  }

  trains.forEach(train => {
    const fromStop = train.schedule.find(s => s.station_code === currentFromCode);
    const toStop = train.schedule.find(s => s.station_code === currentToCode);
    const distance = toStop.distance - fromStop.distance;
    const price = (distance * train.price_per_km).toFixed(2);
    const duration = timeToMinutes(toStop.time) - timeToMinutes(fromStop.time);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    const card = document.createElement('div');
    card.className = 'train-card';
    card.innerHTML = `
      <h3>${train.train_name} (${train.train_id})</h3>
      <p>Departure: ${fromStop.time} → Arrival: ${toStop.time}</p>
      <p>Duration: ${hours}h ${minutes}m</p>
      <p>Distance: ${distance} km | Price: ₹${price}</p>
      <p>Runs on: ${train.runs_on.join(', ')}</p>
      <button class="book-btn">Book Ticket</button>
    `;
    card.querySelector('.book-btn').addEventListener('click', function () {
      openBookingPage(train);
    });
    document.querySelector('.results').appendChild(card);
  });
}

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

  currentFromCode = fromCode;  // store globally
  currentToCode = toCode;      // store globally

  currentResults = alltrains.trains.filter(train => {
    if (!train.runs_on.includes(dayName)) return false;
    const fromStop = train.schedule.find(s => s.station_code === fromCode);
    const toStop = train.schedule.find(s => s.station_code === toCode);
    return fromStop && toStop && fromStop.distance < toStop.distance;
  });

  displayTrains(currentResults);  // use shared display function
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