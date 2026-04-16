import { auth, db, googleProvider, firebaseConfig } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  addDoc,
  serverTimestamp,
  getDocsFromServer,
  getDocFromServer
} from 'firebase/firestore';
import { 
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Appointment, Patient, Doctor, Unit, Procedure, ScheduleConfig, ScheduleBlock, Profile } from './types';

export const firebaseService = {
  // Auth & Profiles
  async getCurrentUser() {
    return auth.currentUser;
  },

  async getUserProfile(userId: string): Promise<Profile | null> {
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as Profile;
    }
    return null;
  },

  async createProfile(profile: any) {
    const docRef = doc(db, 'profiles', profile.id);
    await setDoc(docRef, {
      ...profile,
      created_at: serverTimestamp()
    });
    return profile;
  },

  async updateProfile(userId: string, newData: any) {
    const docRef = doc(db, 'profiles', userId);
    await updateDoc(docRef, newData);
    return true;
  },

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists
      let profile = await this.getUserProfile(user.uid);
      
      if (!profile) {
        // Create new profile for Google user
        const newProfile: Profile = {
          id: user.uid,
          name: user.displayName || 'Google User',
          email: user.email!,
          avatar: user.photoURL || '',
          profile: 'Administrador', // Elevated to Admin
          allowed_units: 'all',
          active: true,
          permissions: ['Total'] // Full permissions for main owner
        };
        await this.createProfile(newProfile);
        profile = newProfile;
      }
      
      return { user, profile };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  async logout() {
    await signOut(auth);
    return true;
  },

  // Units
  async getUnits() {
    const querySnapshot = await getDocs(query(collection(db, 'units'), orderBy('name')));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Unit[];
  },

  async createUnit(unit: Omit<Unit, 'id'>) {
    const docRef = await addDoc(collection(db, 'units'), {
      ...unit,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...unit } as Unit;
  },

  async updateUnit(id: string, unit: Partial<Unit>) {
    const docRef = doc(db, 'units', id);
    const { id: _, ...data } = unit as any;
    await updateDoc(docRef, { ...data, updated_at: serverTimestamp() });
    return true;
  },

  async deleteUnit(id: string) {
    await deleteDoc(doc(db, 'units', id));
    return true;
  },

  // Patients — Force server reads to avoid stale cache
  async getPatients(search?: string) {
    let q = query(collection(db, 'patients'), orderBy('name'));
    const querySnapshot = await getDocsFromServer(q);
    let patients = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Patient[];
    
    if (search) {
      search = search.toLowerCase();
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(search!) || 
        p.cpf?.includes(search!)
      );
    }
    return patients;
  },

  async createPatient(patient: Omit<Patient, 'id'>) {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patient,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...patient } as Patient;
  },

  async updatePatient(id: string, patient: Partial<Patient>) {
    const docRef = doc(db, 'patients', id);
    const { id: _, ...data } = patient as any; // Remove ID from payload
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
    return true;
  },

  // Clean delete: remove the document and clear local memory cache
  async deletePatient(id: string) {
    const docRef = doc(db, 'patients', id);
    await deleteDoc(docRef);
    // With memoryLocalCache, deleted docs won't persist in IndexedDB.
    // No verification needed — deleteDoc is authoritative.
    return true;
  },

  // Appointments
  async getAppointments(filters?: { doctorId?: string; unitId?: string; date?: string; patientId?: string }) {
    let q = collection(db, 'appointments');
    let constraints: any[] = [];
    
    if (filters) {
      if (filters.doctorId) constraints.push(where('doctorId', '==', filters.doctorId));
      if (filters.unitId) constraints.push(where('unitId', '==', filters.unitId));
      if (filters.date) constraints.push(where('date', '==', filters.date));
      if (filters.patientId) constraints.push(where('patientId', '==', filters.patientId));
    }

    const querySnapshot = await getDocs(query(q, ...constraints));
    const appointments = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Appointment[];
    
    // Sort in memory to avoid "Missing Index" errors
    return appointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  },

  async createAppointment(appointment: Omit<Appointment, 'id'>) {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointment,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...appointment } as Appointment;
  },

  async updateAppointment(id: string, data: any) {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
    return true;
  },

  async updateAppointmentStatus(id: string, status: string, history: any[]) {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, {
      status,
      statusHistory: history,
      updated_at: serverTimestamp()
    });
    return true;
  },

  // Doctors
  async getDoctors() {
    const querySnapshot = await getDocsFromServer(query(collection(db, 'doctors'), orderBy('name')));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Doctor[];
  },

  async createDoctor(doctor: Omit<Doctor, 'id'>) {
    const docRef = await addDoc(collection(db, 'doctors'), {
      ...doctor,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...doctor } as Doctor;
  },

  async updateDoctor(id: string, doctor: Partial<Doctor>) {
    const docRef = doc(db, 'doctors', id);
    const { id: _, ...data } = doctor as any;
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
    return true;
  },

  async deleteDoctor(id: string) {
    const docRef = doc(db, 'doctors', id);
    await deleteDoc(docRef);
    return true;
  },

  // Schedules
  async getScheduleConfig(doctorId: string, unitId: string): Promise<ScheduleConfig | null> {
    const q = query(
      collection(db, 'scheduleConfigs'),
      where('doctorId', '==', doctorId),
      where('unitId', '==', unitId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...snap.docs[0].data(), id: snap.docs[0].id } as unknown as ScheduleConfig;
  },

  async saveScheduleConfig(config: ScheduleConfig) {
    const q = query(
      collection(db, 'scheduleConfigs'),
      where('doctorId', '==', config.doctorId),
      where('unitId', '==', config.unitId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = doc(db, 'scheduleConfigs', snap.docs[0].id);
      await updateDoc(docRef, config as any);
    } else {
      await addDoc(collection(db, 'scheduleConfigs'), config);
    }
    return true;
  },

  async getScheduleBlocks(doctorId: string, unitId: string): Promise<ScheduleBlock[]> {
    const q = query(
      collection(db, 'scheduleBlocks'),
      where('doctorId', '==', doctorId),
      where('unitId', '==', unitId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as ScheduleBlock[];
  },

  async saveScheduleBlocks(doctorId: string, unitId: string, blocks: ScheduleBlock[]) {
    const q = query(
      collection(db, 'scheduleBlocks'),
      where('doctorId', '==', doctorId),
      where('unitId', '==', unitId)
    );
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'scheduleBlocks', d.id))));
    await Promise.all(blocks.map(b => addDoc(collection(db, 'scheduleBlocks'), { ...b, doctorId, unitId })));
    return true;
  },

  // Procedures
  async getProcedures() {
    const querySnapshot = await getDocs(query(collection(db, 'procedures'), orderBy('name')));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Procedure[];
  },

  async createProcedure(procedure: any) {
    const docRef = await addDoc(collection(db, 'procedures'), {
      ...procedure,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...procedure };
  },

  async updateProcedure(id: string, procedure: any) {
    const docRef = doc(db, 'procedures', id);
    await updateDoc(docRef, { ...procedure, updated_at: serverTimestamp() });
    return true;
  },

  async deleteProcedure(id: string) {
    await deleteDoc(doc(db, 'procedures', id));
    return true;
  },

  // Insurances
  async getInsurances() {
    const querySnapshot = await getDocs(query(collection(db, 'insurances'), orderBy('name')));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },

  async createInsurance(insurance: any) {
    const docRef = await addDoc(collection(db, 'insurances'), {
      ...insurance,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...insurance };
  },

  async updateInsurance(id: string, insurance: any) {
    const docRef = doc(db, 'insurances', id);
    await updateDoc(docRef, { ...insurance, updated_at: serverTimestamp() });
    return true;
  },

  async deleteInsurance(id: string) {
    await deleteDoc(doc(db, 'insurances', id));
    return true;
  },

  // System Settings
  async getSystemSettings() {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  },

  async updateSystemSettings(settings: any) {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, { ...settings, updated_at: serverTimestamp() }, { merge: true });
    return true;
  },

  // Child User Creation
  async createChildUser(email: string, password: string, profileData: Omit<Profile, 'id'>) {
    const tempAppName = `child-user-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const { user } = await createUserWithEmailAndPassword(tempAuth, email, password);

      const profileDoc: Profile = {
        id: user.uid,
        name: profileData.name,
        email: email,
        profile: profileData.profile,
        active: profileData.active !== undefined ? profileData.active : true,
        permissions: profileData.permissions || ['Agenda'],
        ...(profileData.allowed_units ? { allowed_units: profileData.allowed_units } : {})
      };

      const docRef = doc(db, 'profiles', user.uid);
      await setDoc(docRef, {
        ...profileDoc,
        created_at: serverTimestamp()
      });

      return profileDoc;
    } finally {
      try {
        await signOut(tempAuth);
      } catch (_) { /* ignore */ }
      await deleteApp(tempApp);
    }
  },

  async getChildUsers(): Promise<Profile[]> {
    const querySnapshot = await getDocsFromServer(collection(db, 'profiles'));
    return querySnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Profile[];
  },

  async deleteChildUserProfile(userId: string) {
    const docRef = doc(db, 'profiles', userId);
    await deleteDoc(docRef);
    return true;
  }
};
