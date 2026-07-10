const HUBSPOT_PORTAL_ID="243150086";
const HUBSPOT_FORM_ID="b96255f0-f5d9-4d6b-89da-855d32642640";
const HUBSPOT_ENDPOINT=`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`;

function setLanguage(lang){
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-en]").forEach(el=>{el.textContent=el.dataset[lang]});
  document.getElementById("btn-en").classList.toggle("active",lang==="en");
  document.getElementById("btn-es").classList.toggle("active",lang==="es");
}
document.getElementById("year").textContent=new Date().getFullYear();
setLanguage("en");

document.getElementById("leadForm").addEventListener("submit",async function(e){
  e.preventDefault();

  const form=e.target;
  const status=document.getElementById("formStatus");
  const submitBtn=form.querySelector('button[type="submit"]');
  const data=new FormData(form);

  submitBtn.disabled=true;
  status.className="status-message";
  status.style.display="block";
  status.textContent=document.documentElement.lang==="es"?"Enviando...":"Submitting...";

  const hubspotFields = [
    "firstname",
    "lastname",
    "email",
    "mobilephone",
    "company",
    "property_goal",
    "property_type",
    "timeline",
    "years_in_business",
    "business_stage",
    "financing_status",
    "decision_process"
  ];

  const payload = {
    fields: hubspotFields
      .map(name => ({ name, value: (data.get(name) || "").toString().trim() }))
      .filter(field => field.value !== ""),
    context: {
      pageUri: window.location.href,
      pageName: document.title
    }
  };

  try{
    const response=await fetch(HUBSPOT_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });

    if(!response.ok){
      console.error("HubSpot error:", await response.text());
      throw new Error("HubSpot rejected submission");
    }

    form.reset();
    status.className="status-message success";
    status.textContent=document.documentElement.lang==="es"?"Gracias. Su solicitud fue enviada correctamente.":"Thank you. Your inquiry has been received.";
  }catch(error){
    console.error(error);
    status.className="status-message error";
    status.textContent=document.documentElement.lang==="es"?"Hubo un problema enviando la solicitud. Por favor llame al 713-431-2622.":"There was a problem submitting the request. Please call 713-431-2622.";
  }finally{
    submitBtn.disabled=false;
  }
});