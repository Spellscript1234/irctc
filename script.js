const from=document.getElementById('from');
const too=document.getElementById('to');
const sub1=document.getElementById('sub-1');
const sub2=document.getElementById('sub-2')

async function getstations(){
  const data= await fetch ('stations.json');
  return await data.json();  
}

async function gettrains(){
  const data= await fetch ('trains.json');
  return await data.json();
}

async function getindex(city){
  const result=await getstations();
  const index=result.stations.findIndex(station => station.name === city);
  return index;
}

async function getfro(){
  const fro=from.value;
  const index=await getindex(fro);
  console.log(index);
}

async function getto(){
  const to=too.value;
  const index=await getindex(to);
  console.log(index)
}

sub1.addEventListener('click',getfro);
sub2.addEventListener('click', getto);