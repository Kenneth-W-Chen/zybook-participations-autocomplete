    // ==UserScript==
    // @name        Zybooks auto complete
    // @namespace   github.com/kenneth-w-chen
    // @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
    // @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
    // @downloadurl   https://github.com/Kenneth-W-Chen/zybook-participations-autocomplete/raw/main/zybooks-autocomplete-participation.user.js
    // @match       https://*.zybooks.com/*
    // @grant       none
    // @version     1.0.0
    // @author      Kenneth Chen
    // @description Automatically completes most participation activities for zyBooks
    // @license     MIT
    // ==/UserScript==
    const mcClass = 'multiple-choice-content-resource';
    const animClass = 'animation-player-content-resource';
    const saqClass = 'short-answer-content-resource';
    const dragDropClass = 'custom-content-resource'
    const dragDropNewClass = 'content-tool-content-resource'
    const changeEvt = new CustomEvent('change')
    const config = {childList: true, subtree: true};
    const configTwo = {attribute:true,attributeFilter:['aria-label']};
    var mutObservers = []
    function removeFromArray(element, array){
        array.splice(mutObservers.indexOf(element),1)
    }
    async function clickMCQ(inputs){
        for(let i = 0; i < inputs.length;i++){
            inputs[i].click()
            await new Promise((accept)=>{setTimeout(accept,300)})
        }
    }

    async function dragDrop(target, dest) {
        const dataTransfer = new dt();

        function createCustomEvent(type) {
            const event = new CustomEvent(type, { bubbles: true, cancelable: true });
            event.dataTransfer = dataTransfer;
            return event;
        }
        target.dispatchEvent(createCustomEvent('dragstart'));
        target.dispatchEvent(createCustomEvent('drop'));
        dest.dispatchEvent(createCustomEvent('drop'));
    }
    class dt {
        constructor() {
            this.dropEffect = "move";
            this.effectAllowed = "move";
            this.files = [];
            this.items = new dtil();
            this.types = [];
        }
        setData(format, data) {
            this.data[format] = data;
        }
        getData(format) {
            return this.data[format];
        }
        clearData(format = null) {
            if (format) {
                delete this.data[format];
            } else {
                this.data = {};
            }
        }
        clearData(type) {
            if (type) {
                const index = this.types.indexOf(type);
                if (index !== -1) {
                    this.types.splice(index, 1);
                }
            } else {
                this.types = [];
            }
        }

        getData(type) {
            const index = this.types.indexOf(type);
            return index !== -1 ? this.items[index].data : '';
        }

        setData(type, data) {
            const index = this.types.indexOf(type);
            if (index !== -1) {
                this.items[index].data = data;
            } else {
                this.types.push(type);
                this.items.add(new dti(type, data));
            }
        }

        setDragImage(imageElement, x, y) {
        }
    }
    class dti {
        constructor(type, data) {
            this.type = type;
            this.data = data;
        }
    }
    class dtil extends Array {
        add(item) {
            this.push(item);
        }
    }
    function createButton() {
        if (document.querySelector('button[COMPLETE-PAGE]') !== null) {
            mutObservers.forEach((observer)=>{observer.disconnect()})
            mutObservers = []
            return
        }
        let btn = document.createElement('BUTTON')
        let spn = document.createElement('SPAN')
        btn.classList.add('zb-button', 'raised')
        btn.setAttribute('COMPLETE-PAGE', '')
        btn.appendChild(spn)
        spn.textContent = 'Complete Page'
        spn.color = "#ffffff"

        btn.onclick = () => {
            if(spn.textContent==='Running...')return
            spn.textContent = "Running..."
            btn.classList.add('disabled')
            async function complete(){
                let activities = document.querySelectorAll('.participation')
                let promises = []
                activities.forEach((activity) => {
                    if(activity.querySelector('.check[aria-label="Activity completed"]'))return
                    if (activity.classList.contains(saqClass)) {
                        let showAns = activity.querySelector('.show-answer-button')
                        let p = new Promise((resolve)=>{let temp = new MutationObserver((mutList, observer) => {
                            let answer = activity.querySelector('.forfeit-answer')
                            if (answer === null) return
                            let textArea = activity.querySelector('textarea')
                            textArea.value = answer.textContent
                            textArea.dispatchEvent(changeEvt)
                            activity.querySelector('.zb-button.primary.raised.check-button').click()
                            removeFromArray(observer,mutObservers)
                            resolve()
                            observer.disconnect()
                        })
                            mutObservers.push(temp)
                            temp.observe(activity, config)
                            showAns.click();
                            showAns.click();})
                        promises.push(p)

                    }
                    else if(activity.classList.contains(mcClass)){
                        activity.querySelectorAll('.question-set-question').forEach((elem)=>{
                          promises.push(clickMCQ(Array.from(elem.querySelectorAll('input'))))
                        })
                    }
                    else if(activity.classList.contains(animClass)){
                        let animControls = activity.querySelector('.animation-controls')
                        animControls.querySelector('input').click()
                        let p = new Promise((resolve)=>{
                            let temp  = new MutationObserver((mutations, observer)=> {
                                    for (let i = 0; i < mutations.length; i++) {
                                        let addedNode = mutations[i].addedNodes[0];
                                        if(typeof addedNode!=='object' || typeof addedNode.getAttribute !== 'function') continue
                                        let label = addedNode.getAttribute('aria-label')
                                        if (label === 'Play' || label === 'Pause'){
                                            let temp2 = new MutationObserver((mutations1,observer1)=>{
                                                let label2 = mutations1[0].target.ariaLabel
                                                if(label2 === 'Pause')return
                                                if(label2==='Play') mutations1[0].target.click()
                                                else {
                                                    removeFromArray(observer1,mutObservers)
                                                    resolve()
                                                    observer1.disconnect()
                                                }
                                            })
                                            mutObservers.push(temp2)
                                            temp2.observe(addedNode,configTwo)
                                            break;
                                        }
                                    }
                                }
                            )
                            mutObservers.push(temp)
                            temp.observe(animControls,config)
                            //Play
                            animControls.querySelector('button').click()
                        })
                        promises.push(p)

                    }
                    else if(activity.classList.contains(dragDropClass)){
                        async function solve(activity){
                            let draggables = Array.from(activity.querySelectorAll('.draggable-object'))
                            let targets = Array.from(activity.querySelectorAll('.draggable-object-target'))
                            while(draggables.length!==0){
                                for(let i = 0; i < targets.length;i++){
                                    await dragDrop(draggables[0],targets[i])
                                    await new Promise((resolve)=>{setTimeout(resolve,150)})
                                    if(targets[i].parentElement.querySelector('.correct')!==null){
                                        draggables.shift()
                                        targets.splice(i,1)
                                        break;
                                    }
                                }
                            }
                        }
                        promises.push(solve())
                    }
                    else if(activity.classList.contains(dragDropNewClass)){
                        if(activity.querySelector('.check-button'))
                        {
                            //display warning that it couldn't be completed
                            return;
                        }
                        async function dragDropNewSolve(){
                            let blocks = Array.from(activity.querySelectorAll('.block'))
                            if(blocks.length===0)return
                            let parent = blocks[0].parentElement
                            function dispatch(node){
                                node.dispatchEvent(new KeyboardEvent('keyup',{code:'Enter',key:'Enter'}))
                                node.dispatchEvent(new KeyboardEvent('keyup',{code:'ArrowRight',key:'ArrowRight'}))
                            }
                            while(blocks.length!==0){
                                for(let i = 0; i<blocks.length;i++){
                                    dispatch(blocks[i])
                                    if(blocks[i].parentElement!== parent){
                                        blocks.splice(i,1)
                                        break
                                    }
                                }
                            }
                        }
                        promises.push(dragDropNewSolve())
                    }
                })
                Promise.all(promises).then(()=>{
                    spn.textContent = 'Complete Page'
                    btn.classList.remove('disabled')
                })
            }
            complete()
        }
        document.querySelector('.right-buttons').insertBefore(btn, document.querySelector('a[href="/catalog"]'))
    }

    function main() {
        createButton()
    }

    waitForKeyElements('.zybook-section-title', main)
