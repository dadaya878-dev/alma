extends CharacterBody3D

@export var walk_speed: float = 4.2
@export var acceleration: float = 14.0
@export var mouse_sensitivity: float = 0.0025

@onready var pivot: Node3D = $CameraPivot
@onready var camera: Camera3D = $CameraPivot/Camera3D
@onready var hint_label: Label = get_tree().current_scene.get_node("HUD/Hint")

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var pitch: float = -0.12
var message_timer: float = 0.0

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	pivot.rotation.x = pitch

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * mouse_sensitivity)
		pitch = clamp(pitch - event.relative.y * mouse_sensitivity, -0.9, 0.45)
		pivot.rotation.x = pitch
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _physics_process(delta: float) -> void:
	var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := (transform.basis * Vector3(input_vector.x, 0, input_vector.y)).normalized()
	if direction:
		velocity.x = move_toward(velocity.x, direction.x * walk_speed, acceleration * delta)
		velocity.z = move_toward(velocity.z, direction.z * walk_speed, acceleration * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, acceleration * delta)
		velocity.z = move_toward(velocity.z, 0.0, acceleration * delta)

	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = 0.0

	move_and_slide()

	if Input.is_action_just_pressed("interact"):
		_try_interact()

	if message_timer > 0.0:
		message_timer -= delta
		if message_timer <= 0.0:
			hint_label.text = "Исследуй место. Подойди к предмету и нажми E."

func _try_interact() -> void:
	var from := camera.global_position
	var to := from + (-camera.global_transform.basis.z * 3.2)
	var query := PhysicsRayQueryParameters3D.create(from, to)
	query.exclude = [self]
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	if hit and hit.collider.is_in_group("interactable"):
		var target = hit.collider
		if target.has_method("interact"):
			var result: String = target.interact()
			hint_label.text = result
			message_timer = 5.0
	else:
		hint_label.text = "Здесь пока ничего интересного."
		message_timer = 2.0
