import { getFirestore, doc, getDoc, deleteDoc, updateDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const db = getFirestore();
const storage = getStorage();

export const fetchCourseById = async (cid) => {
  try {
    const docRef = doc(db, "classroom", cid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }; 
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
};

export const deleteCourseById = async (courseId) => {
  try {
    const courseRef = doc(db, "classroom", courseId);
    await deleteDoc(courseRef);
    console.log("Course deleted successfully");
    return true; 
  } catch (error) {
    console.error("Error deleting course:", error);
    return false; 
  }
};

export const updateCourseById = async (courseId, updatedData, newImage) => {
  try {
    const courseRef = doc(db, "classroom", courseId);

    if (newImage) {
      const storageRef = ref(storage, `courseImages/${courseId}/${newImage.name}`);
      await uploadBytes(storageRef, newImage);
      const imageURL = await getDownloadURL(storageRef);
      updatedData.imageURL = imageURL;
    }

    await updateDoc(courseRef, updatedData);
    console.log("Course updated successfully");
    return true; 
  } catch (error) {
    console.error("Error updating course:", error);
    return false; 
  }
};
export const fetchStudents = async (courseId) => {
  try {
    const courseRef = doc(db, "classroom", courseId);
    const docSnap = await getDoc(courseRef);

    if (docSnap.exists()) {
      const students = docSnap.data().students; 
      return students;
    } else {
      console.log("No such course!");
      return [];
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

export const createCheckin = async (courseId, checkinNo) => {
  try {
    const checkinRef = doc(db, "checkins", `${courseId}-${checkinNo}`);
    await setDoc(checkinRef, { courseId, checkinNo, timestamp: new Date() });
    console.log("Checkin created successfully");
    return true;
  } catch (error) {
    console.error("Error creating checkin:", error);
    return false;
  }
};
export const fetchCheckinHistory = async (classroomId) => {
  try {
    const checkinCollection = collection(db, `classroom/${classroomId}/checkin`);
    const checkinSnapshot = await getDocs(checkinCollection);
    const checkinHistory = checkinSnapshot.docs.map(doc => doc.data());
    return checkinHistory;
  } catch (error) {
    console.error("Error fetching checkin history:", error);
    throw error;
  }
};
