// Firebase service stub
export const firebaseService = {
  async initializeFirebase(config: any) {
    console.log('Firebase initialized with config:', config)
  },

  async syncMessages(messages: any[]) {
    console.log('Syncing messages to Firebase:', messages)
  },
}
