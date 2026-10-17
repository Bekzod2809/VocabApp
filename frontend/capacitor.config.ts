import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'uz.vocabapp.app',
  appName: 'VocabApp',
  webDir: 'dist',
  android: {
    // Ilova https://localhost'dan ochiladi, server esa hozircha oddiy http (laptop, Wi-Fi).
    // Serverga HTTPS qo'yilgach buni o'chirsa bo'ladi.
    allowMixedContent: true,
  },
}

export default config
