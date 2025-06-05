import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const DragDropWorkplan = ({ tasks, onReorder, kiosk = false }) => {
  const handleDragEnd = (result) => {
    if (!result.destination || kiosk) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const styles = {
    container: {
      padding: kiosk ? '30px' : '20px',
    },
    task: {
      backgroundColor: 'white',
      border: '2px solid #ecf0f1',
      borderRadius: kiosk ? '15px' : '8px',
      padding: kiosk ? '30px' : '15px',
      marginBottom: kiosk ? '20px' : '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      userSelect: 'none',
    },
    taskDragging: {
      transform: 'rotate(5deg)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    },
    title: {
      fontSize: kiosk ? '28px' : '18px',
      fontWeight: 'bold',
      marginBottom: kiosk ? '15px' : '8px',
      color: '#2c3e50',
    },
    description: {
      fontSize: kiosk ? '20px' : '14px',
      color: '#7f8c8d',
      marginBottom: kiosk ? '15px' : '8px',
    },
    meta: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: kiosk ? '18px' : '12px',
      color: '#95a5a6',
      flexWrap: 'wrap',
      gap: kiosk ? '15px' : '10px',
    },
    time: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: kiosk ? '8px 15px' : '4px 8px',
      borderRadius: '4px',
      fontSize: kiosk ? '16px' : '12px',
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="workplan">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{
              ...styles.container,
              backgroundColor: snapshot.isDraggingOver ? '#f8f9fa' : 'transparent',
            }}
          >
            {tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id.toString()}
                index={index}
                isDragDisabled={kiosk}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...styles.task,
                      ...(snapshot.isDragging ? styles.taskDragging : {}),
                      ...provided.draggableProps.style,
                    }}
                  >
                    <div style={styles.title}>{task.title}</div>
                    {task.description && (
                      <div style={styles.description}>{task.description}</div>
                    )}
                    <div style={styles.meta}>
                      <span>👤 {task.assigned_to || 'Nicht zugewiesen'}</span>
                      {task.start_time && task.end_time && (
                        <span style={styles.time}>
                          {task.start_time} - {task.end_time}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DragDropWorkplan; 