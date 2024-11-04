// utils/dynamoDbClient.js
// 채팅 관리 테이블

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamoDb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.CHAT_SESSIONS_TABLE_NAME;

// connectionId 저장
async function saveConnection(orderId, connectionId, sessionData) {
  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        orderId,
        timestamp: new Date().toISOString(), // 현재 시간
        connectionId,
        isSessionActive: sessionData.isSessionActive,
        sessionStatus: sessionData.sessionStatus,
        pendingFields: sessionData.pendingFields,
        responsedData: sessionData.responsedData,
        lastInteractionTimestamp: sessionData.lastInteractionTimestamp,
        chatHistory: sessionData.chatHistory,
      },
    });
    await dynamoDb.send(command);
    console.log(`Connection saved: ${connectionId}`);
  } catch (error) {
    console.error(
      "Error saving connection data to DynamoDB:",
      JSON.stringify(error)
    );
    throw new Error("connection DynamoDB 저장 오류");
  }
}
async function saveChat(orderId, chatMessage) {
  const timestamp = new Date().toISOString();
  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Key: { orderId }, // connectionId 구분
      UpdateExpression:
        "SET chatHistory = list_append(if_not_exists(chatHistory, :empty_list), :new_chat)",
      ExpressionAttributeValues: {
        ":new_chat": [chatMessage], // 추가할 메시지
        ":empty_list": [], // 빈 리스트 초기값
      },
    });
    await dynamoDb.send(command);
    console.log(`Chat saved: ${JSON.stringify(chatMessage)}`);
  } catch (error) {
    console.error("Error saving chat to DynamoDB:", JSON.stringify(error));
    throw new Error("DynamoDB 채팅 저장 오류");
  }
}
// complete 처리 수정예정

// connectionId 삭제 수정예정
// async function disConnection(orderId, connectionId) {
//   try {
//     const command = new DeleteCommand({
//       TableName: TABLE_NAME,
//       Key: { orderId },
//     });
//     dynamoDb.send(command);
//     console.log(
//       `ConnectionId ${connectionId} successfully deleted from DynamoDB`
//     );
//   } catch (error) {
//     console.error(
//       `Failed to delete ConnectionId ${connectionId} from DynamoDB:`,
//       JSON.stringify(error)
//     );
//     throw new Error("DynamoDB 삭제 오류");
//   }
// }
// TODO: complete 가 안되었는데 예기치 못하게 종료 되었을 때 처리 작성예정
//sessionStatus = disconnected, active= false

// 정상적 disconnect 처리
async function markSessionDeactive(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression:
        // "SET sessionStatus = :status, isSessionActive = :active",
        "SET isSessionActive = :active",
      ExpressionAttributeValues: {
        ":active": false, // 세션을 비활성화
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${customerId} marked as complete`);
  } catch (error) {
    console.error(
      `Failed to mark session complete for customer ${customerId}:`,
      JSON.stringify(error)
    );
    throw new Error("SessionActive업데이트 오류");
  }
}

// complete 처리: 세션 상태를 완료로 표시
async function markSessionComplete(customerId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression:
        "SET sessionStatus = :status, isSessionActive = :active",
      ExpressionAttributeValues: {
        ":status": "completed", // 세션 상태를 completed로 설정
        ":active": false, // 세션을 비활성화
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${customerId} marked as complete`);
  } catch (error) {
    console.error(
      `Failed to mark session complete for customer ${customerId}:`,
      JSON.stringify(error)
    );
    throw new Error("세션 완료 상태 업데이트 오류");
  }
}

// 채팅 세션 데이터 가져오기
async function getSessionData(orderId) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
    });
    const response = await dynamoDb.send(command);
    return response.Item; // 세션 데이터 반환
  } catch (error) {
    console.error(
      `Failed to get session data for customer ${orderId}:`,
      JSON.stringify(error)
    );
    throw new Error("채팅세션 데이터 조회 오류");
  }
}

module.exports = {
  saveConnection,
  saveChat,
  markSessionDeactive,
  markSessionComplete,
  getSessionData,
};
