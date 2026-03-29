const from=document.getElementById('from');
const too=document.getElementById('to');
let date=document.getElementById('date')
const sub=document.getElementById('sub')
let info={};
const searching=document.getElementById('searching');
let flag=0;

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

async function searchtrains(){
  const alltrains=await gettrains();
  console.log(alltrains);
}

async function checkall(){
  const fro=from.value;
  const index1=await getindex(fro);
  const to=too.value;
  const index2=await getindex(to);
  let val=date.value;
  val=new Date(val)
  const day=val.getDay();
  info={index1,index2,day};
  if(index1!=-1 && index2!=-1 && index2>index1){
    searching.innerText=(`Trains from ${fro} to ${to} on ${val}`);
    searchtrains;
  }
}

sub.addEventListener('click',checkall);
