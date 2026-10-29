import {test,expect} from '@playwright/test';
test.beforeEach(async({request})=>{await request.post('/api/action',{data:{type:'mode',mode:'baseline'}});await request.post('/api/action',{data:{type:'reset'}});});
test('visitor recovers a contradiction, shares it privately, sees a lasting consequence, and resolves the archive',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'Establish connection'}).click();
 await expect(page.getByRole('heading',{name:'Life goes on.'})).toBeVisible();
 await page.getByRole('navigation',{name:'Desktop applications'}).getByRole('button',{name:'GhostMail'}).click();
 const mail=page.getByRole('region',{name:'GhostMail'});await expect(mail.getByRole('heading',{name:'Before you open the archive'})).toBeVisible();
 await page.getByRole('navigation',{name:'Desktop applications'}).getByRole('button',{name:'Archive.exe'}).click();
 const archive=page.getByRole('region',{name:'Archive.exe'});await expect(archive.getByText('External clients: 0',{exact:false})).toBeVisible();
 await archive.getByRole('button',{name:'Recover this record'}).click();await expect(archive.getByRole('button',{name:'Saved in notebook'})).toBeDisabled();
 await archive.getByRole('button',{name:'Open notebook'}).click();
 const notebook=page.getByRole('region',{name:'Evidence notebook'});await notebook.getByRole('button',{name:'Tell one account…'}).click();await notebook.getByRole('button',{name:'Tell Mara'}).click();
 await expect(mail.getByRole('button',{name:'A quiet word' ,exact:false}).first()).toBeVisible();
 await request.post('/api/action',{data:{type:'tick'}});
 const saved=await(await request.get('/api/state')).json();expect(saved.world.agents.find((a:{id:string})=>a.id==='len').knownFacts).toContain('carrier');
 await page.reload();await page.getByRole('button',{name:'Establish connection'}).click();
 await page.getByRole('navigation',{name:'Desktop applications'}).getByRole('button',{name:'Archive.exe'}).click();
 const again=page.getByRole('region',{name:'Archive.exe'});await again.getByRole('button',{name:'HAPPY_BIRTHDAY.EML'}).click();await again.getByRole('button',{name:'Recover this record'}).click();await expect(again.getByRole('button',{name:'Saved in notebook'})).toBeDisabled();
 await again.getByRole('button',{name:'CONTINUITY.INI'}).click();await again.getByRole('button',{name:'Recover this record'}).click();await expect(again.getByRole('button',{name:'Saved in notebook'})).toBeDisabled();await again.getByRole('button',{name:'Open notebook'}).click();
 const final=page.getByRole('region',{name:'Evidence notebook'});await final.getByRole('button',{name:'Release the complete record'}).click();await expect(final.getByRole('heading',{name:'The correction is permanent.'})).toBeVisible();
 const state=await(await request.get('/api/state')).json();expect(state.world.ending).toBe('exposed');expect(errors).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('window controls, keyboard movement, archive search, reduced motion, and service validation',async({page,request},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'Establish connection'}).click();
 const browser=page.getByRole('region',{name:'DeadBrowser'});await browser.getByRole('button',{name:'Minimize DeadBrowser'}).click();await expect(browser).toBeHidden();await page.locator('.task-buttons').getByRole('button',{name:'DeadBrowser'}).click();await expect(browser).toBeVisible();
 await browser.getByRole('button',{name:'Maximize DeadBrowser'}).click();await expect(browser).toBeVisible();
 await page.getByRole('navigation',{name:'Desktop applications'}).getByRole('button',{name:'Archive.exe'}).click();const archive=page.getByRole('region',{name:'Archive.exe'});await archive.getByRole('textbox',{name:'Search archive'}).fill('birthday');await expect(archive.getByRole('button',{name:'HAPPY_BIRTHDAY.EML'})).toBeVisible();await expect(archive.getByRole('button',{name:'CARRIER.LOG'})).toHaveCount(0);
 await archive.getByRole('button',{name:'Close Archive.exe'}).click();await expect(archive).toHaveCount(0);
 if(testInfo.project.name==='desktop'){const title=browser.getByLabel('DeadBrowser title bar.',{exact:false});await title.focus();await title.press('Enter');await title.press('ArrowRight');}
 const bad=await request.post('/api/action',{data:{type:'message',target:'unknown',text:'x'}});expect(bad.status()).toBe(400);
 const cross=await request.post('/api/action',{data:{type:'reset'},headers:{Origin:'https://unrelated.invalid'}});expect(cross.status()).toBe(403);
});
