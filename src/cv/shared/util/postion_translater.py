


def translate_img_coordinates(event_x, event_y):
    box_width, box_height = 1920, 1080
    
    
    translated_x = int(event_x * box_width)
    translated_y = int(event_y * box_height)
    
    # For mirror effect
    inverted_x = box_width - translated_x
    
    return (inverted_x, translated_y)

def translate_img_coordinates_scaled(event_x, event_y, scale):
    box_width, box_height = 1280, 720

    #print(f"x: {event_x} y: {event_y} scale : {scale}" )
    
    normalized_scale =  1
    
    translated_x = int(event_x  * box_width)
    translated_y = int(event_y  * box_height)
    
    # For mirror effect
    inverted_x = box_width - translated_x
    
    return (inverted_x, translated_y)