import { getFirestore, doc, getDoc } from 'firebase/firestore';

// ฟังก์ชันดึงข้อมูลห้องเรียนตาม `cid`
export const fetchCourseById = async (cid) => {
  const db = getFirestore();
  try {
    const docRef = doc(db, 'classroom', cid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
};
