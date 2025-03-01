import { getFirestore, doc, getDoc, deleteDoc, updateDoc, collection, getDocs, setDoc,onSnapshot} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const db = getFirestore();
const storage = getStorage();

console.log("courseService.js loaded - Version: 1.2");
console.log("onSnapshot defined:", typeof onSnapshot === 'function');

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

export const saveQuestion = async (cid, cno, questionNo, questionText) => {
  try {
    if (!cid || !cno || !questionNo || !questionText) {
      throw new Error("Missing required parameters");
    }
    const questionRef = doc(db, `classroom/${cid}/checkin/${cno}/questions`, questionNo);
    console.log("Saving question at:", `classroom/${cid}/checkin/${cno}/questions/${questionNo}`);
    await setDoc(questionRef, {
      question_no: questionNo,
      question_text: questionText,
      question_show: true,
      timestamp: new Date().toISOString()
    }, { merge: true });
    console.log("Question saved successfully for cid:", cid, "cno:", cno, "questionNo:", questionNo);
    return true;
  } catch (error) {
    console.error("Error saving question:", {
      message: error.message,
      cid,
      cno,
      questionNo,
      stack: error.stack
    });
    return false;
  }
};

export const closeQuestion = async (cid, cno, questionNo) => {
  try {
    if (!cid || !cno || !questionNo) {
      throw new Error("Missing required parameters");
    }
    const questionRef = doc(db, `classroom/${cid}/checkin/${cno}/questions`, questionNo);
    console.log("Attempting to close question at:", `classroom/${cid}/checkin/${cno}/questions/${questionNo}`);
    const docSnap = await getDoc(questionRef);
    if (!docSnap.exists()) {
      console.error("Document does not exist at path:", `classroom/${cid}/checkin/${cno}/questions/${questionNo}`);
      throw new Error("Question document does not exist");
    }
    await updateDoc(questionRef, { question_show: false });
    console.log("Question closed successfully at:", `classroom/${cid}/checkin/${cno}/questions/${questionNo}`);
    return true;
  } catch (error) {
    console.error("Detailed error closing question:", {
      message: error.message,
      cid,
      cno,
      questionNo,
      stack: error.stack
    });
    return false;
  }
};

export const fetchQuestionRealtime = (cid, cno, questionNo, callback) => {
  const questionRef = doc(db, `classroom/${cid}/checkin/${cno}/questions`, questionNo);
  return onSnapshot(questionRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

export const fetchAnswersRealtime = (cid, cno, questionNo, callback) => {
  const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/questions/${questionNo}/answers`);
  return onSnapshot(answersRef, (snapshot) => {
    const answersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(answersData.map(answer => answer.text));
  });
};

export const addAnswer = async (cid, cno, questionNo, answerText) => {
  try {
    const answerRef = doc(collection(db, `classroom/${cid}/checkin/${cno}/questions/${questionNo}/answers`));
    await setDoc(answerRef, { text: answerText, timestamp: new Date().toISOString() });
    console.log("Answer added successfully");
    return true;
  } catch (error) {
    console.error("Error adding answer:", error.message);
    return false;
  }
};

