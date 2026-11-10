import test from 'node:test';
import assert from 'node:assert/strict';
import {esc,money,initials,statusNames,localDateTime} from '../src/ui.js';
test('Escape user-provided text before inserting HTML',()=>{assert.equal(esc('<script>"x" & y</script>'), '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;');assert.equal(esc(null),'');});
test('Display Colombian peso amounts without fractional cents',()=>{assert.match(money(70000),/70[.,]000/);assert.doesNotMatch(money(70000),/000[.,]00$/);});
test('Avatar initials',()=>{assert.equal(initials('Laura Martinez'),'LM');});
test('Known job and assignment states have readable labels',()=>{for(const state of ['PUBLICADO','ACEPTADO','EN_CAMINO','EN_LUGAR','INICIADO','TERMINADO','CONFIRMADO','COMPLETADO'])assert.ok(statusNames[state]);});
test('Datetime input conversion keeps local date/hour format',()=>{assert.match(localDateTime(new Date('2030-01-02T12:30:00Z')), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);});
