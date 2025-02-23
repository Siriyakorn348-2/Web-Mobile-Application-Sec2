import { getFirestore, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
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
      const storageRef = ref(storage, `courseImages/${courseId}`);
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
