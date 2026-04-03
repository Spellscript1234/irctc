let currentResults = [];
let currentFromCode = '';
let currentToCode = '';


let stationsDataCache = null;
let trainsDataCache = null;

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function sortBy(type, order, event) {
  
  document.querySelectorAll('.sort-bar button').forEach(btn => {
    btn.classList.remove('active');
  });
  if (event) event.target.classList.add('active');

  const sorted = [...currentResults].sort((a, b) => {
    const fromStopA = a.schedule.find(s => s.station_code === currentFromCode);
    const toStopA = a.schedule.find(s => s.station_code === currentToCode);
    const fromStopB = b.schedule.find(s => s.station_code === currentFromCode);
    const toStopB = b.schedule.find(s => s.station_code === currentToCode);

    if (type === 'price') {
      const priceA = (toStopA.distance - fromStopA.distance) * a.price_per_km;
      const priceB = (toStopB.distance - fromStopB.distance) * b.price_per_km;
      return order === 'asc' ? priceA - priceB : priceB - priceA;
    }

    if (type === 'duration') {
      let durationA = timeToMinutes(toStopA.time) - timeToMinutes(fromStopA.time);
      let durationB = timeToMinutes(toStopB.time) - timeToMinutes(fromStopB.time);
      
    
      if (durationA < 0) durationA += 24 * 60;
      if (durationB < 0) durationB += 24 * 60;

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
  const heading = document.getElementById('searching').innerText;
  const resultsContainer = document.querySelector('.results');
  resultsContainer.innerHTML = '<h4 id="searching"></h4>';
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
    
    let duration = timeToMinutes(toStop.time) - timeToMinutes(fromStop.time);
    if (duration < 0) duration += 24 * 60; 

    
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
    resultsContainer.appendChild(card);
  });
}


async function getstations() {
  if (stationsDataCache) return stationsDataCache;
  try {
    const res = await fetch('stations.json');
    stationsDataCache = await res.json();
    return stationsDataCache;
  } catch (error) {
    console.error("Failed to load stations:", error);
    alert("Error loading station data.");
  }
}

async function gettrains() {
  if (trainsDataCache) return trainsDataCache;
  try {
    const res = await fetch('trains.json');
    trainsDataCache = await res.json();
    return trainsDataCache;
  } catch (error) {
    console.error("Failed to load trains:", error);
    alert("Error loading train data.");
  }
}

async function searchtrains(fromCode, toCode, day) {
  const alltrains = await gettrains();
  if (!alltrains) return;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[day];

  currentFromCode = fromCode;  
  currentToCode = toCode;      

  currentResults = alltrains.trains.filter(train => {
    if (!train.runs_on.includes(dayName)) return false;
    const fromStop = train.schedule.find(s => s.station_code === fromCode);
    const toStop = train.schedule.find(s => s.station_code === toCode);
    return fromStop && toStop && fromStop.distance < toStop.distance;
  });

  displayTrains(currentResults);
}

async function checkall() {
  const fro = document.getElementById('from').value.trim();
  const to = document.getElementById('to').value.trim();
  const val = document.getElementById('date').value;

  if (!fro || !to || !val) {
    alert('Please fill all fields!');
    return;
  }

  const stationsData = await getstations();
  if (!stationsData) return;

  const fromStation = stationsData.stations.find(
    s => s.name.toLowerCase() === fro.toLowerCase()
  );
  const toStation = stationsData.stations.find(
    s => s.name.toLowerCase() === to.toLowerCase()
  );

  const searching = document.getElementById('searching');

  if (!fromStation || !toStation) {
    searching.innerText = 'One or both stations not found!';
    return;
  }

  if (fromStation.code === toStation.code) {
    searching.innerText = 'From and To stations cannot be the same!';
    return;
  }

  const [year, month, day_num] = val.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day_num);
  const day = dateObj.getDay();

  document.querySelector('.results').innerHTML = '<h4 id="searching"></h4>';
  document.getElementById('searching').innerText =
    `Trains from ${fro} to ${to} on ${dateObj.toDateString()}`;

  searchtrains(fromStation.code, toStation.code, day);
}


document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  
  document.getElementById('sub').addEventListener('click', checkall);
  
  
  getstations();
  gettrains();
});
