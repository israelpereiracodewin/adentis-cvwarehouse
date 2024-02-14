

(function(){

    const FORM_SEARCH_ID = 'email-form',
        INPUT_SEARCH = 'name',
        INPUT_LOCATION = 'search-location',
        INPUT_TYPEWORK = 'search-type-of-work',
        INPUT_PAGE = 'search-page',
        BTN_RESET = 'btn-reset',
        JOB_LIST = 'job-list-results',
        PAGINATION_WRAP = 'pagination-wrap';

    const API_URL_JOBS_CVWAREHOUSE = '/jobs.json';//'https://bypass.decode.pt/raw?url=https://api.cvwarehouse.com/cvwJobsApiAdentis/d1c941c4-a446-47ce-90e6-2c5ca3fb13de/Job/own_website/JSON1_15';

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

    const uniqueArray = (value, index, self) => self.indexOf(value) === index && !!value;
    
    const insertAfter = (referer, newNode) => referer.parentNode.insertBefore(newNode, referer.nextSibling);

    const getSearchParams = () => {

        const urlParams = new URLSearchParams(window.location.search),
              params = {};
              
        for(var param of urlParams) 
            if(!!param[1])
                params[param[0]] = param[1];
        
       return params;
    }

    const setSearchParams = (params = {}) => {

        const url = new URL(window.location.href);

        for(let key in params)
           if(!!params[key])
             url.searchParams.set(key, params[key]);
           else 
            url.searchParams.delete(key)

        window.history.pushState({}, '', url);
    }

    const createformSearch = form => {

        const searchElem  = form.querySelector(`#${INPUT_SEARCH}`),
             locationElem = form.querySelector(`#${INPUT_LOCATION}`),
             typeWorkElem = form.querySelector(`#${INPUT_TYPEWORK}`),
             pageElem     = form.querySelector(`#${INPUT_PAGE}`),
             btnReset     = form.querySelector(`#${BTN_RESET}`);

        const queryParams = () => { return {
                q : searchElem.value, 
                location : locationElem.value,
                typeWork : typeWorkElem.value,
                page     : pageElem.value
            }
        }

        const setValueBySearchParams = () => {
            
            const searchParams = getSearchParams();

            'q' in searchParams && (searchElem.value = searchParams.q);
            'location' in searchParams && (locationElem.value = searchParams.location);
            'typeWork' in searchParams && (typeWorkElem.value = searchParams.typeWork);
            'page' in searchParams && (pageElem.value = searchParams.page);

            onChange()
        }

        const onChange = () => {

            const searchParams = queryParams();

            setSearchParams(searchParams)  

            !!handler && handler(searchParams);
        }

        searchElem.addEventListener('input', onChange)
        locationElem.addEventListener('change', onChange)
        typeWorkElem.addEventListener('change', onChange)

        btnReset.addEventListener('click', () => {

            [ searchElem, locationElem, typeWorkElem ]
                .forEach(i => i.value = '');
                
            onChange()
        })

        const setSelectOptions = (selectElem, options) => {

            const appendOption = o => {

                const option = document.createElement('option');

                option.text = option.value = o;
                selectElem.appendChild(option);
            }

            options.forEach(appendOption)
        }

        let handler = null; changePage = null;

        return {
            queryParams,
            setValueBySearchParams,
            setLocationOptions : options => setSelectOptions(locationElem, options),
            setTypeWorkOptions : options => setSelectOptions(typeWorkElem, options),
            setPage : page => {

                pageElem.value = page;

                const searchParams = queryParams();

                setSearchParams(searchParams) 

                !!changePage && changePage(page);
            },
            currentPage : () => parseInt(pageElem.value),
            change      : event => handler = event,
            changePage  : event => changePage = event,
            emit        : () => !!changePage && changePage(parseInt(pageElem.value)) 
        }
    }    
    
    const createJobList = (formSearch, jobListElem) => {

        let jobs = [];
     
        const itemElemOriginal = jobListElem.querySelector('.job-card_wrap'),
              itemNotFound     = jobListElem.querySelector('.filter_empty');
            
        itemNotFound.remove();

        const createItemElement = (job) => {

            const cloneNode = itemElemOriginal.cloneNode(true);

            cloneNode.querySelector('.heading-style-h4').innerText = job?.internalName;

            !job?.remoteWorkOption && (cloneNode.querySelector('.is-job')?.remove());      
            
            cloneNode.querySelector('.is-local').innerText = job?.place?.regions?.map(j => j.name)?.join(',');

            cloneNode.href  = `job-description.html?job=${job.id}`
            cloneNode.title = job?.internalName;

            return cloneNode;
        }

        const render = jobs => {

            jobListElem.innerHTML = '';

            if(!jobs.length) 
                jobListElem.append(itemNotFound);
            else 
                jobs.forEach(job => jobListElem.append(createItemElement(job)));            
        }

        const search = params => {

            return jobs
                .filter(job => !params.location || (!!params.location && job?.place?.country?.name === params.location))
                .filter(job => !params.typeWork || (!!params.typeWork && job?.remoteWorkOption?.name === params.typeWork))
                .filter(job => !params.q || (!!params.q && [
                    job?.place?.country?.name, 
                    job?.remoteWorkOption?.name,
                    job?.name?.value,
                    job?.description?.value
                ].some(q => q?.toLowerCase()?.includes(params.q?.toLowerCase()))))
        }

        const showNotFound = () => {

            jobListElem.innerHTML = '';
            jobListElem.append(itemNotFound);
        }

        const fetchAPI = async () => {

            try{

                const called = await $get(API_URL_JOBS_CVWAREHOUSE);
                
                jobs = called
                    .sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate))
                    .filter(job => job?.description?.lang == "en-US");
                    
                formSearch.setLocationOptions(jobs.map(job => job?.place?.country?.name)?.filter(uniqueArray)?.reverse());
                formSearch.setTypeWorkOptions(jobs.map(job => job?.remoteWorkOption?.name)?.filter(uniqueArray)?.reverse())

            }catch(_){

                showNotFound();
            }
        }

        return {
            fetchAPI,
            jobs : () => [...jobs],
            search,
            render,
            showNotFound
        }
    }

    const createPagination = ({
        rootElem, 
        perPage = 10, 
        formSearch
    }) => {
         
        const btnPrev = rootElem.querySelector('.is-prev'),
              btnNext = rootElem.querySelector('.is-next');
            
        const btnsApi = []; let arrayPages = [];
        
        const btnStyleClass = 'filter_pagination-number';
       
        let jobs = [];

        const clearBtns = () => {
            
            btnsApi.forEach(btn => btn.elem.removeEventListener('click', btn.handler));

            rootElem.querySelectorAll(`.${btnStyleClass}`).forEach(a => a.remove());
        }

        const setPage = currentPage => {

            formSearch.setPage(currentPage);
            renderBtns(currentPage);
        }

        const createBtnPage = page => {

            const btn = document.createElement('button');
                
            const label = page < 0 ? '...' : page;

            btn.title = label;
            btn.classList.add(btnStyleClass);
            btn.innerHTML = `<div>${label}</div>`;

            const onClick = () => {

                let currentPage = page;

                if(page === -1)
                    currentPage = arrayPages[(arrayPages.indexOf(page)-1)]+1;
                else if(page === -2)
                    currentPage = arrayPages[(arrayPages.indexOf(page)+1)]-1;

                setPage(currentPage)
            }

            btn.addEventListener('click', onClick);

            return {
                elem : btn,
                handler : onClick
            };
        }

        const calculateNumPages = () =>  Math.ceil(jobs.length / perPage);

        const renderBtns = currentPage => {

            const numPages = calculateNumPages()
       
            const pages = Array.from({length : numPages}).map((_, i) => i+1);

            const arrayBtns = () => {

                let currentPages = [...pages];
    
                const SPACE_BEETWEN = 2;
    
                const nextPages = (currentPage + SPACE_BEETWEN),
                      prevPages = (currentPage - SPACE_BEETWEN)
    
                currentPages = currentPages.filter(p => p >= prevPages && p <= nextPages);
                
                if(currentPages.at(0) > SPACE_BEETWEN)
                    currentPages.unshift(1, -2)
    
                if(currentPages.at(-1) < pages.length)
                    currentPages.push(-1, pages.length);
                
                return currentPages;
            } 
            
            clearBtns()
           
            let prevElem = btnPrev;

            arrayPages = arrayBtns();

            arrayPages.forEach(a => {
                
                const btnPagination = createBtnPage(a);
                
                btnsApi.push(btnPagination);

                insertAfter(prevElem, btnPagination.elem);

                prevElem = btnPagination.elem;
            })
        }

        btnPrev.addEventListener('click', () => {

            const prevPage = formSearch.currentPage()-1;

            if(prevPage > 0) setPage(prevPage);
        })

        btnNext.addEventListener('click', () => {

            const nextPage = formSearch.currentPage()+1;

            if(nextPage <= calculateNumPages()) setPage(nextPage);
        })
        
        const paginate = page => {

            let start = (page - 1) * perPage;
            
            return jobs.slice(start, start + perPage);
        }
        
        return {
            renderBtns,
            perPage,
            paginate,
            setJobs : j => jobs = j
        }
    }
    
    const registerJobList = async () => {

        const formElem       = document.getElementById(FORM_SEARCH_ID),
              jobListElem    = document.getElementById(JOB_LIST),
              paginationWrap = document.getElementById(PAGINATION_WRAP);

        const formSearch = createformSearch(formElem);

        const jobList = createJobList(formSearch, jobListElem);

        try{

            await jobList.fetchAPI();
    
            const pagination = createPagination({
                rootElem : paginationWrap, 
                formSearch
            })           

            formSearch.setValueBySearchParams()

            formSearch.changePage(page => {

                const searchJobs = jobList.search(formSearch.queryParams())

                pagination.setJobs(searchJobs);
                pagination.renderBtns(page);

                jobList.render(pagination.paginate(page));
            })

            formSearch.change(() => formSearch.setPage(1))  

            formSearch.emit()

        }catch(e){

            jobList.showNotFound()
        }
    }

    const bootstrap = () => {

        registerJobList();
    }

    window.addEventListener('DOMContentLoaded', bootstrap)
})()