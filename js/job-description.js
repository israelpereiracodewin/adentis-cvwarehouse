

(function(){

    const API_URL_JOBS_CVWAREHOUSE = 'https://api.cvwarehouse.com/cvwJobsApiNearU/f1999e48-cee5-4f55-984e-1f26a6f0cf55/Job/own_website/JSON1_16'

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

            remoteElem.innerText = foundJob?.remoteWorkOption || 'Presencial'

            localElem.innerText = foundJob?.place?.regions?.map(j => j.name)?.join(',');

            descElem.innerHTML = foundJob.description.value;

            btnApply.target = '_blank';
            btnApply.href  = `https://jobpage.cvwarehouse.com/ApplicationForm/AppForm?job=${jobId}&companyGuid=ba77d654-87d2-4396-8c64-b79de977a2ea&channel=own_website&lang=en-US`

        }catch(_){

            window.location.href = 'job-list';
        }
    }   

    const registerJobDescription = () => {
        
        const urlParams = new URLSearchParams(window.location.search)

        jobDescription(document.querySelector(`#${JOB_WRAP}`), urlParams.get('job'));
    }

    const bootstrap = () => {

        registerJobDescription();
    }

    window.addEventListener('DOMContentLoaded', bootstrap)
})()