// ==UserScript==
// @name        Zybooks auto complete
// @namespace   github.com/kenneth-w-chen
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// @downloadurl   https://github.com/Kenneth-W-Chen/zybook-participations-autocomplete/raw/main/zybooks-autocomplete-participation.user.js
// @match       https://*.zybooks.com/*
// @grant       none
// @version     1.1.1
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
const ariaLabelConfig = {attribute:true,attributeFilter:['aria-label']};
const classConfig = {attribute:true,attributeFilter: ['class']}
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
    let div = document.createElement('DIV')
    let btn = document.createElement('BUTTON')
    let spn = document.createElement('SPAN')
    let modal = document.createElement('DIV')
    let modalText = document.createElement('P')
    let modalClose = document.createElement('i')
    {
        btn.classList.add('zb-button', 'raised')
        btn.setAttribute('COMPLETE-PAGE', '')
        modal.style.border = '5px solid gray'
        modal.style.borderRadius = '0 5px 5px 0'
        modal.style.background = 'white'
        modal.style.width = '15rem'
        modal.style.visibility = 'hidden'
        modal.style.position = 'absolute'
        modalText.style.textAlign = 'center'
        modalText.style.maxWidth = '80%'
        modalText.style.marginLeft = '5px'
        modalText.style.overflowWrap = 'break-word'
        modalClose.classList.add('material-icons', 'med', 'grey', 'mr-2', 'zb-button')
        modalClose.textContent = 'close'
        modalClose.style.position = 'absolute'
        modalClose.style.top = '0'
        modalClose.style.right = '0'
        modalClose.style.cursor = 'pointer'
        modalClose.style.margin = '0'
        btn.appendChild(spn)
        div.appendChild(btn)
        div.appendChild(modal)
        modal.appendChild(modalText)
        modal.appendChild(modalClose)
    }
    spn.textContent = 'Complete Page'
    spn.color = "#ffffff"

    btn.onclick = () => {
        if(spn.textContent==='Running...')return
        spn.textContent = "Running..."
        btn.classList.add('disabled')
        async function complete(){
            let activities = document.querySelectorAll('.participation')
            let promises = []
            let err = 0
            let errCount = {1:0,2:0}
            let ran = false
            activities.forEach((activity) => {
                if(activity.querySelector('.check[aria-label*="Activity completed"]') !== null) {
                    return
                }
                ran = true
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
                                        temp2.observe(addedNode,ariaLabelConfig)
                                        break;
                                    }
                                    else{
                                        let button = addedNode.querySelector('div')
                                        if(button!==null&&(button.classList.contains('play-button')||button.classList.contains('pause-button'))){
                                            console.log('a')
                                            let temp2 = new MutationObserver((mutations1,observer1)=>{
                                                if(mutations1[0].target.classList.contains('play-button')){
                                                    console.log('b')
                                                    if(mutations1[0].target.classList.contains('rotate-180')){
                                                        console.log('c')
                                                        removeFromArray(observer1,mutObservers)
                                                        resolve()
                                                        observer1.disconnect()
                                                    }
                                                    console.log('d')
                                                    mutations1[0].target.parentNode.click()
                                                }
                                            })
                                            mutObservers.push(temp2)
                                            temp2.observe(button,classConfig)
                                            break;
                                        }
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
                        err = err | 1
                        errCount[1]++
                        console.log('err1')
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
                else{
                    console.log('err2')
                    err = err | 2
                    errCount[2]++
                }
            })
            Promise.all(promises).then(()=>{
                spn.textContent = 'Complete Page'
                btn.classList.remove('disabled')
                modal.style.visibility = 'visible'
                if(!ran){
                    modalText.textContent = 'All participation activities on page were already completed, or no activities were found.'
                    return
                }
                modalText.textContent = 'Completed page.'
                console.log(err.toString())
                if((err&1)===1)
                    modalText.textContent += ` ${errCount[1].toString()} drag and drop activities couldn't be completed.`
                if((err&2)===2)
                    modalText.textContent += ` ${errCount[2].toString()} unknown activities found.`
            })
        }
        complete()
    }
    modalClose.onclick = ()=>{
        modalText.textContent = ''
        modal.style.visibility = 'hidden'
    }
    document.querySelector('.right-buttons').insertBefore(div, document.querySelector('a[href="/catalog"]'))
}

function main() {
    createButton()
}

waitForKeyElements('.zybook-section-title', main)
