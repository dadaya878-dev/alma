extends StaticBody3D

var examined := false

func interact() -> String:
	if not examined:
		examined = true
		return "Аня нашла старый медальон. На обратной стороне выгравировано имя «Альма»."
	return "Медальон холодный на ощупь. Значит, Альма действительно была здесь."
