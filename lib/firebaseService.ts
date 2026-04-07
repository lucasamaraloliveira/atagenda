import { auth, db, googleProvider } from './firebase';
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
  serverTimestamp
} from 'firebase/firestore';
import { 
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
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
      return { id: docSnap.id, ...docSnap.data() } as Profile;
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
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
  },

  // Patients
  async getPatients(search?: string) {
    let q = query(collection(db, 'patients'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    let patients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];
    
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

  // Appointments
  async getAppointments(filters: { doctorId?: string, unitId?: string, date?: string }) {
    let q = collection(db, 'appointments');
    let constraints: any[] = [orderBy('time')];
    
    if (filters.doctorId) constraints.push(where('doctorId', '==', filters.doctorId));
    if (filters.unitId) constraints.push(where('unitId', '==', filters.unitId));
    if (filters.date) constraints.push(where('date', '==', filters.date));

    const querySnapshot = await getDocs(query(q, ...constraints));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
  },

  async createAppointment(appointment: Omit<Appointment, 'id'>) {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointment,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...appointment } as Appointment;
  },

  // Doctors
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
    await deleteDoc(doc(db, 'doctors', id));
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

  async updateAppointment(id: string, data: any) {
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
    return true;
  },

  async getDoctors() {
    const querySnapshot = await getDocs(query(collection(db, 'doctors'), orderBy('name')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Doctor[];
  },

  async getScheduleConfig(doctorId: string, unitId: string) {
    const q = query(collection(db, 'scheduleConfigs'), where('doctorId', '==', doctorId), where('unitId', '==', unitId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const d = querySnapshot.docs[0];
      return { id: d.id, ...d.data() } as any as ScheduleConfig;
    }
    return null;
  },

  async getScheduleBlocks(doctorId: string, unitId: string) {
    const q = query(collection(db, 'scheduleBlocks'), where('doctorId', '==', doctorId), where('unitId', '==', unitId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScheduleBlock[];
  },

  // Procedures
  async getProcedures() {
    const querySnapshot = await getDocs(query(collection(db, 'procedures'), orderBy('name')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Procedure[];
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
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  async deletePatient(id: string) {
    await deleteDoc(doc(db, 'patients', id));
    return true;
  }
};
