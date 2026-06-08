#!/usr/bin/env node

const API_BASE = 'https://english-bot.ohnedan.workers.dev';

const vocabularySet = {
  name: 'Dopamine #66 At the airport',
  language: 'en_uk',
  words: [
    { word_en: 'healthy lifestyle', word_uk: 'здоровий спосіб життя' },
    { word_en: 'to manage smth well', word_uk: 'добре чимось керувати / добре справлятися з чимось' },
    { word_en: 'delayed', word_uk: 'затриманий (про рейс)' },
    { word_en: 'gate', word_uk: 'вихід (на посадку в аеропорту)' },
    { word_en: 'express boarding tickets', word_uk: 'квитки на експрес-посадку' },
    { word_en: 'to land', word_uk: 'приземлятися' },
    { word_en: 'to take off', word_uk: 'злітати' },
    { word_en: 'journey', word_uk: 'подорож/поїздка' },
    { word_en: 'destination', word_uk: 'пункт призначення' },
    { word_en: 'unhealthy lifestyle', word_uk: 'нездоровий спосіб життя' },
    { word_en: 'to influence smth/sb', word_uk: 'впливати на щось/когось' },
    { word_en: 'announcement', word_uk: 'оголошення' },
    { word_en: 'flight', word_uk: 'рейс/політ' },
    { word_en: 'boarding pass', word_uk: 'посадковий талон' },
    { word_en: 'boarding', word_uk: 'посадка (на літак)' },
  ]
};

async function addVocabulary() {
  try {
    console.log(`📚 Adding vocabulary set: "${vocabularySet.name}"`);
    console.log(`   Words: ${vocabularySet.words.length}`);

    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        set_name: vocabularySet.name,
        language: vocabularySet.language,
        words: vocabularySet.words,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error adding vocabulary:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Message: ${data.error || data.message || 'Unknown error'}`);
      process.exit(1);
    }

    console.log('✅ Vocabulary set added successfully!');
    console.log(`   Set ID: ${data.setId}`);
    console.log(`   Imported: ${data.importedCount} words`);
    if (data.skippedCount > 0) {
      console.log(`   Skipped: ${data.skippedCount} words`);
    }
    console.log(`\n🔗 Access at: https://studify-up.vercel.app/set/${data.setId}`);

  } catch (error) {
    console.error('❌ Failed to add vocabulary:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

addVocabulary();
