

(function(){

    const API_URL_JOBS_CVWAREHOUSE = '/jobs.json';//'https://bypass.decode.pt/raw?url=https://api.cvwarehouse.com/cvwJobsApiAdentis/d1c941c4-a446-47ce-90e6-2c5ca3fb13de/Job/own_website/JSON1_15';

    const JOB_WRAP = 'jobdescription-wrap';

    const $get = (url, payload = {}) => {

        return new Promise((resolve, reject) => {

            $.get({
                url, 
                dataType   : 'json', 
                data       : payload,
                success    : resolve
            }).fail(reject)
        })       
    }

    const jobDescription = async (rootElem, jobId) => {

        const titleElem  = rootElem.querySelector('[data-desc-title]'),
              remoteElem = rootElem.querySelector('[data-desc-remote]'),
              localElem  = rootElem.querySelector('[data-desc-local]'),
              descElem   = rootElem.querySelector('[data-desc-desc]'),
              btnApply   = rootElem.querySelector('[data-btn-apply]');

        try{

            const called = await $get(API_URL_JOBS_CVWAREHOUSE);
                   
            const foundJob = called.find(c => c.id === jobId);

            if(!foundJob)
                throw new Exception('not found')

            titleElem.innerText = foundJob?.name?.value;

            !foundJob?.remoteWorkOption && (remoteElem?.remove());      

            localElem.innerText = foundJob?.place?.regions?.map(j => j.name)?.join(',');

            descElem.innerHTML = foundJob.description.value;

            btnApply.target = '_blank';
            btnApply.href  = `https://jobpage.cvwarehouse.com/ApplicationForm/AppForm?job=${jobId}&companyGuid=6ad00e65-ec33-4e2e-a3e7-2feea05a5923&channel=own_website&lang=en-US`

        }catch(_){

            window.location.href = 'job-list.html';
        }
    }   

    const registerJobDescription = () => {
        
        const urlParams = new URLSearchParams(window.location.search)

        jobDescription(document.querySelector(`.${JOB_WRAP}`), urlParams.get('job'));
    }

    const bootstrap = () => {

        registerJobDescription();
    }

    window.addEventListener('DOMContentLoaded', bootstrap)
})()