


def translate_img_coordinates(event_x, event_y):
    box_width, box_height = 1920, 1080
    
    
    translated_x = int(event_x * box_width)
    translated_y = int(event_y * box_height)
    
    # For mirror effect
    inverted_x = box_width - translated_x
    
    return (inverted_x, translated_y)